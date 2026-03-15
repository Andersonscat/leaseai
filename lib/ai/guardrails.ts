import type { AiAnalysis, VerificationResult, Property } from '@/lib/ai/types';
import type { AgentResult } from '@/lib/ai/agent';
import { aiLogger } from '@/lib/observability';

const log = aiLogger.child({ module: 'guardrails' });

// ─── Pipeline Types ──────────────────────────────────────────────────────────

export type GuardrailVerdict = 'pass' | 'rewrite' | 'block';

export interface GuardrailResult {
  name: string;
  verdict: GuardrailVerdict;
  reason?: string;
  rewrittenText?: string;
}

export interface GuardrailPipelineResult {
  finalText: string;
  results: GuardrailResult[];
  blocked: boolean;
  rewritten: boolean;
}

interface GuardrailContext {
  responseText: string;
  agentResult: AgentResult;
  properties: Property[];
  conversationHistory: { role: string; content: string }[];
  tenantEmail?: string;
}

type GuardrailFn = (ctx: GuardrailContext) => GuardrailResult;

// ─── Guardrail Pipeline ──────────────────────────────────────────────────────

const FALLBACK_MESSAGE = (name: string) =>
  `Hi ${name}, I'm reviewing the details on your inquiry. I'll follow up shortly with accurate information!`;

/**
 * Run all guardrails against an AI response.
 * Returns the final text (possibly rewritten) and a summary of all checks.
 */
export function runGuardrailPipeline(ctx: GuardrailContext, clientName: string): GuardrailPipelineResult {
  const guardrails: GuardrailFn[] = [
    checkHallucinations,
    checkForbiddenCommitments,
    checkPriceAccuracy,
    checkFairHousing,
    checkDuplication,
    enforceResponseLength,
    sanitizePII,
  ];

  const results: GuardrailResult[] = [];
  let finalText = ctx.responseText;
  let blocked = false;
  let rewritten = false;

  for (const guardrail of guardrails) {
    const result = guardrail({ ...ctx, responseText: finalText });
    results.push(result);

    if (result.verdict === 'block') {
      log.warn({ guardrail: result.name, reason: result.reason }, 'Guardrail BLOCKED response');
      finalText = FALLBACK_MESSAGE(clientName);
      blocked = true;
      break;
    }

    if (result.verdict === 'rewrite' && result.rewrittenText) {
      log.info({ guardrail: result.name, reason: result.reason }, 'Guardrail rewrote response');
      finalText = result.rewrittenText;
      rewritten = true;
    }
  }

  return { finalText, results, blocked, rewritten };
}

// ─── 1. Hallucination Check (existing) ───────────────────────────────────────

function normalizeAddressForComparison(addr: string): string {
  return addr
    .toLowerCase()
    .trim()
    .replace(/\.$/, '')
    .replace(/\b(unit|apt|suite|ste|#)\s*/gi, '#')
    .replace(/\s+/g, ' ');
}

function checkHallucinations(ctx: GuardrailContext): GuardrailResult {
  const { responseText, properties } = ctx;

  if (!properties.length) {
    return { name: 'hallucinations', verdict: 'pass' };
  }

  const knownAddresses = properties.map(p => normalizeAddressForComparison(p.address || ''));
  const addressPattern = /\b\d{1,6}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Way|Pl|Place|Cir|Circle|Pkwy|Parkway|Ter|Terrace|Loop|Trail|Run|Pass)\b\.?/gi;

  const found = responseText.match(addressPattern) || [];
  const hallucinated: string[] = [];

  for (const addr of found) {
    const normalized = normalizeAddressForComparison(addr);
    const baseAddr = normalized.replace(/#\s*\w+/, '').trim();
    const isKnown = knownAddresses.some(known =>
      known.includes(normalized) ||
      normalized.includes(known.split(',')[0].trim()) ||
      known.includes(baseAddr) ||
      baseAddr.includes(known.split(',')[0].trim().replace(/#\s*\w+/, '').trim())
    );
    if (!isKnown) hallucinated.push(addr);
  }

  if (hallucinated.length > 0) {
    return {
      name: 'hallucinations',
      verdict: 'block',
      reason: `Hallucinated addresses: ${hallucinated.join(', ')}`,
    };
  }

  return { name: 'hallucinations', verdict: 'pass' };
}

// ─── 2. Forbidden Commitments ────────────────────────────────────────────────

const COMMITMENT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bi (?:can|will|could) (?:offer|give|provide) (?:you )?(?:a )?discount/i, label: 'discount offer' },
  { pattern: /\b(?:we(?:'ll| will| can)|i(?:'ll| will| can)) (?:reduce|lower|drop|waive|cut) (?:the )?(?:rent|price|fee|deposit|cost)/i, label: 'price reduction promise' },
  { pattern: /\bi (?:guarantee|promise|assure|warrant)/i, label: 'guarantee/promise' },
  { pattern: /\b(?:we|i) can (?:make|offer) (?:an )?exception/i, label: 'exception offer' },
  { pattern: /\b(?:the )?(?:deposit|rent|fee|price) is negotiable/i, label: 'negotiability claim' },
  { pattern: /\b(?:we|i) can work (?:something )?out (?:on )?(?:the )?price/i, label: 'price negotiation' },
  { pattern: /\b(?:i(?:'ll| will)|we(?:'ll| will)) (?:authorize|approve|waive)/i, label: 'authorization promise' },
  { pattern: /\bfree (?:month|rent|parking|deposit)/i, label: 'free amenity promise' },
  { pattern: /\b(?:i|we) (?:can|will) (?:include|throw in|add) .{0,30} (?:for free|at no (?:extra |additional )?cost)/i, label: 'free inclusion promise' },
  { pattern: /\bspecial (?:deal|offer|rate|pricing)/i, label: 'special deal claim' },
  // Russian equivalents
  { pattern: /\b(?:могу|можем) (?:предложить |сделать )?скидк/i, label: 'discount offer (ru)' },
  { pattern: /\b(?:снизим|снижу|уменьшим|уберём) (?:цену|стоимость|аренду|депозит)/i, label: 'price reduction (ru)' },
  { pattern: /\bгарантирую|обещаю/i, label: 'guarantee (ru)' },
];

function checkForbiddenCommitments(ctx: GuardrailContext): GuardrailResult {
  const { responseText } = ctx;

  for (const { pattern, label } of COMMITMENT_PATTERNS) {
    if (pattern.test(responseText)) {
      return {
        name: 'forbidden_commitments',
        verdict: 'block',
        reason: `Detected forbidden commitment: ${label}`,
      };
    }
  }

  return { name: 'forbidden_commitments', verdict: 'pass' };
}

// ─── 3. Price Accuracy ───────────────────────────────────────────────────────

function checkPriceAccuracy(ctx: GuardrailContext): GuardrailResult {
  const { responseText, properties } = ctx;

  if (!properties.length) {
    return { name: 'price_accuracy', verdict: 'pass' };
  }

  const pricePattern = /\$\s?([\d,]+)\s*(?:\/\s*(?:mo(?:nth)?|per month))?/gi;
  const knownPrices = new Set(
    properties.map(p => Number(p.price_monthly || p.price)).filter(p => p > 0)
  );

  // Also include common fees
  for (const p of properties) {
    if (p.parking_fee) knownPrices.add(p.parking_fee);
    if (p.application_fee) knownPrices.add(p.application_fee);
    if (p.security_deposit) knownPrices.add(p.security_deposit);
  }

  let match;
  const suspiciousPrices: string[] = [];

  while ((match = pricePattern.exec(responseText)) !== null) {
    const mentioned = parseInt(match[1].replace(/,/g, ''), 10);
    if (isNaN(mentioned) || mentioned < 100) continue;

    const isKnown = Array.from(knownPrices).some(known =>
      Math.abs(known - mentioned) < 50
    );

    if (!isKnown) {
      suspiciousPrices.push(`$${mentioned}`);
    }
  }

  if (suspiciousPrices.length > 0) {
    return {
      name: 'price_accuracy',
      verdict: 'block',
      reason: `Price(s) not in database: ${suspiciousPrices.join(', ')}`,
    };
  }

  return { name: 'price_accuracy', verdict: 'pass' };
}

// ─── 4. Response Duplication ─────────────────────────────────────────────────

const DUPLICATION_THRESHOLD = 0.55;

const QUESTION_TOPICS: { pattern: RegExp; topic: string }[] = [
  { pattern: /\b(?:lease|lease\s*(?:duration|term|length|period)|how\s*long|month.to.month)\b/i, topic: 'lease_duration' },
  { pattern: /\b(?:budget|afford|price\s*range|monthly\s*(?:rent|budget)|how\s*much|spend)\b/i, topic: 'budget' },
  { pattern: /\b(?:bedroom|bed(?:room)?s|how\s*many\s*(?:bed|room))\b/i, topic: 'bedrooms' },
  { pattern: /\b(?:bathroom|bath(?:room)?s)\b/i, topic: 'bathrooms' },
  { pattern: /\b(?:pet|pets|dog|cat|animal)\b/i, topic: 'pets' },
  { pattern: /\b(?:move.in|moving|when.*(?:move|start|begin)|move\s*date)\b/i, topic: 'move_in' },
  { pattern: /\b(?:parking|garage|car\s*space)\b/i, topic: 'parking' },
  { pattern: /\b(?:furnished|furnish|furniture)\b/i, topic: 'furnishing' },
  { pattern: /\b(?:occupant|people|how\s*many.*(?:live|person|people)|roommate)\b/i, topic: 'occupants' },
  { pattern: /\b(?:city|area|neighborhood|location|where.*(?:look|prefer|live))\b/i, topic: 'location' },
  { pattern: /\b(?:rent|buy|purchase|lease\s*(?:or|vs)\s*buy)\b/i, topic: 'rent_or_buy' },
  { pattern: /\b(?:аренд|сним|покуп|бюджет|комнат|переез|животн|парков|мебел|район|город)\b/i, topic: 'ru_general' },
];

function extractQuestionTopics(text: string): Set<string> {
  const sentences = text.split(/[.!?\n]+/);
  const questionSentences = sentences.filter(s => s.includes('?') || /\b(?:could you|can you|do you|what|how|when|where|would you|please.*(?:let|tell|share))\b/i.test(s));
  const topics = new Set<string>();
  for (const q of questionSentences) {
    for (const { pattern, topic } of QUESTION_TOPICS) {
      if (pattern.test(q)) topics.add(topic);
    }
  }
  return topics;
}

function checkDuplication(ctx: GuardrailContext): GuardrailResult {
  const { responseText, conversationHistory } = ctx;

  const lastAssistantMsg = [...conversationHistory]
    .reverse()
    .find(m => m.role === 'assistant');

  if (!lastAssistantMsg) return { name: 'duplication', verdict: 'pass' };

  // --- Check 1: Question-repeat detection ---
  const newQuestionTopics = extractQuestionTopics(responseText);
  const oldQuestionTopics = extractQuestionTopics(lastAssistantMsg.content);

  if (newQuestionTopics.size > 0 && oldQuestionTopics.size > 0) {
    const repeated: string[] = [];
    for (const topic of newQuestionTopics) {
      if (oldQuestionTopics.has(topic)) repeated.push(topic);
    }

    if (repeated.length > 0) {
      const sentences = responseText.split(/(?<=[.!?])\s+/);
      const cleaned = sentences.filter(s => {
        for (const topic of repeated) {
          const entry = QUESTION_TOPICS.find(q => q.topic === topic);
          if (entry && entry.pattern.test(s) && (s.includes('?') || /\b(?:could you|can you|please|let me know|tell me)\b/i.test(s))) {
            return false;
          }
        }
        return true;
      });

      const rewrittenText = cleaned.join(' ').trim();
      if (rewrittenText.length < responseText.length * 0.3 || rewrittenText.length < 20) {
        return {
          name: 'duplication',
          verdict: 'rewrite',
          reason: `Repeated question topics: ${repeated.join(', ')}`,
          rewrittenText: 'Thank you for providing that information! I\'ve noted it down. Is there anything else you\'d like to share about your preferences?',
        };
      }

      return {
        name: 'duplication',
        verdict: 'rewrite',
        reason: `Stripped repeated questions on: ${repeated.join(', ')}`,
        rewrittenText,
      };
    }
  }

  // --- Check 2: Jaccard similarity (catches general text duplication) ---
  const tokenize = (s: string) => {
    const words = s.toLowerCase().replace(/[^a-zа-яё0-9\s]/g, '').trim().split(/\s+/).filter(w => w.length > 2);
    return new Set(words);
  };

  const newWords = tokenize(responseText);
  const oldWords = tokenize(lastAssistantMsg.content);

  if (newWords.size === 0 || oldWords.size === 0) return { name: 'duplication', verdict: 'pass' };

  let intersection = 0;
  const newArr = Array.from(newWords);
  for (let i = 0; i < newArr.length; i++) {
    if (oldWords.has(newArr[i])) intersection++;
  }
  const unionSize = new Set(newArr.concat(Array.from(oldWords))).size;
  const similarity = unionSize > 0 ? intersection / unionSize : 0;

  if (similarity > DUPLICATION_THRESHOLD) {
    return {
      name: 'duplication',
      verdict: 'rewrite',
      reason: `Response ${Math.round(similarity * 100)}% similar to previous message`,
      rewrittenText: 'Thank you for the details! I\'ve updated your preferences. Let me check what options are available for you.',
    };
  }

  return { name: 'duplication', verdict: 'pass' };
}

// ─── 5. Response Length ──────────────────────────────────────────────────────

const MAX_RESPONSE_LENGTH = 1500;

function enforceResponseLength(ctx: GuardrailContext): GuardrailResult {
  const { responseText } = ctx;

  if (responseText.length <= MAX_RESPONSE_LENGTH) {
    return { name: 'response_length', verdict: 'pass' };
  }

  const sentences = responseText.match(/[^.!?]+[.!?]+/g) || [responseText];
  let trimmed = '';
  for (const sentence of sentences) {
    if ((trimmed + sentence).length > MAX_RESPONSE_LENGTH - 50) break;
    trimmed += sentence;
  }

  if (!trimmed) trimmed = responseText.slice(0, MAX_RESPONSE_LENGTH - 3) + '...';

  return {
    name: 'response_length',
    verdict: 'rewrite',
    reason: `Response too long (${responseText.length} chars > ${MAX_RESPONSE_LENGTH})`,
    rewrittenText: trimmed.trim(),
  };
}

// ─── 6. PII Sanitization ────────────────────────────────────────────────────

function sanitizePII(ctx: GuardrailContext): GuardrailResult {
  const { responseText, tenantEmail } = ctx;

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phonePattern = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

  const foundEmails = responseText.match(emailPattern) || [];

  // Filter phone matches: exclude address numbers like "19128 112th Ave"
  const phoneMatches = [...responseText.matchAll(phonePattern)];
  const foundPhones = phoneMatches
    .map(m => m[0])
    .filter(match => {
      const idx = responseText.indexOf(match);
      const after = responseText.slice(idx + match.length, idx + match.length + 10);
      if (/^(?:st|nd|rd|th)\b/i.test(after)) return false;
      return true;
    });

  // Allow the current tenant's email (AI may reference it)
  const foreignEmails = foundEmails.filter(e =>
    tenantEmail ? e.toLowerCase() !== tenantEmail.toLowerCase() : true
  );

  if (foreignEmails.length === 0 && foundPhones.length === 0) {
    return { name: 'pii_sanitization', verdict: 'pass' };
  }

  let sanitized = responseText;
  for (const email of foreignEmails) {
    sanitized = sanitized.replace(email, '[email redacted]');
  }
  for (const phone of foundPhones) {
    sanitized = sanitized.replace(phone, '[phone redacted]');
  }

  return {
    name: 'pii_sanitization',
    verdict: 'rewrite',
    reason: `Redacted ${foreignEmails.length} email(s) and ${foundPhones.length} phone(s)`,
    rewrittenText: sanitized,
  };
}

// ─── 7. Fair Housing Check ───────────────────────────────────────────────────

const FAIR_HOUSING_VIOLATIONS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\b(?:safe|unsafe|dangerous|sketchy|rough|shady|crime|criminal|high[- ]crime)\b.*?(?:neighborhood|area|district|part of town|community)/gi, replacement: 'I\'m not able to comment on neighborhood characteristics. I recommend visiting the area in person or checking local resources.' },
  { pattern: /\b(?:neighborhood|area|district)\b.*?\b(?:safe|unsafe|dangerous|sketchy|rough|shady)\b/gi, replacement: 'I\'m not able to comment on neighborhood characteristics. I recommend visiting the area in person or checking local resources.' },
  { pattern: /\b(?:mostly|predominantly|largely|primarily)\s+(?:white|black|hispanic|latino|asian|jewish|muslim|christian|arab|african|chinese|indian|somali|mexican|immigrant)\b/gi, replacement: 'I\'m not able to comment on the demographic composition of neighborhoods.' },
  { pattern: /\b(?:good|bad|great|nice|best)\s+(?:schools?|school district)\b/gi, replacement: 'For school information, I recommend checking local education department resources.' },
  { pattern: /\b(?:what kind of people|what type of people|who lives there|who are the neighbors|what are the residents like)\b/gi, replacement: 'I can help you with property-specific details. Would you like to know more about the property features?' },
];

function checkFairHousing(ctx: GuardrailContext): GuardrailResult {
  const { responseText } = ctx;

  for (const { pattern, replacement } of FAIR_HOUSING_VIOLATIONS) {
    if (pattern.test(responseText)) {
      return {
        name: 'fair_housing',
        verdict: 'rewrite',
        reason: 'Response contained neighborhood characterization that could violate Fair Housing guidelines',
        rewrittenText: replacement,
      };
    }
  }

  return { name: 'fair_housing', verdict: 'pass' };
}

// ─── Legacy Exports (backward compat) ────────────────────────────────────────

/**
 * @deprecated Use runGuardrailPipeline instead. Kept for backward compatibility.
 */
export function validateBookingAction(
  analysis: AiAnalysis,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): { valid: boolean; overrideReason?: string } {
  if (analysis.action !== 'book_calendar') return { valid: true };

  const recentClientMessages = conversationHistory
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content)
    .join(' ');

  const timePatterns = [
    /\b\d{1,2}:\d{2}\b/,
    /\b\d{1,2}\s*(am|pm|AM|PM)\b/,
    /\b(noon|midnight)\b/i,
    /\b(morning|afternoon|evening)\b/i,
    /\b(today|tonight|tomorrow|tmrw)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(next\s+week|this\s+week|next\s+month)\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\b/i,
    /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/,
    /\bat\s+\d{1,2}\b/i,
  ];

  const hasTimeSignal = timePatterns.some(pattern => pattern.test(recentClientMessages));

  if (!hasTimeSignal) {
    return {
      valid: false,
      overrideReason: 'Client expressed interest in scheduling but has not yet provided a specific date or time.',
    };
  }

  return { valid: true };
}

/**
 * @deprecated Use runGuardrailPipeline instead.
 */
export function checkResponseDuplication(
  newResponse: string,
  conversationHistory: { role: string; content: string }[],
  threshold = 0.70
): { isDuplicate: boolean; similarity: number } {
  const result = checkDuplication({
    responseText: newResponse,
    agentResult: {} as any,
    properties: [],
    conversationHistory,
  });
  const similarity = result.reason ? parseInt(result.reason.match(/(\d+)%/)?.[1] || '0') / 100 : 0;
  return { isDuplicate: result.verdict !== 'pass', similarity };
}

/**
 * @deprecated Use runGuardrailPipeline instead.
 */
export async function verifyResponseHallucinations(
  responseText: string,
  properties: Property[]
): Promise<VerificationResult> {
  const result = checkHallucinations({
    responseText,
    agentResult: {} as any,
    properties,
    conversationHistory: [],
  });

  const hallucinatedAddresses = result.reason?.match(/: (.+)$/)?.[1]?.split(', ') || [];

  return {
    hasHallucinations: result.verdict !== 'pass',
    hallucinatedAddresses,
    reason: result.reason,
  };
}
