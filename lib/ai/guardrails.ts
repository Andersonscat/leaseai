import type { AiAnalysis, VerificationResult, Property } from '@/lib/ai/types';

/**
 * Guardrail: Validate that a book_calendar action is legitimate.
 * Scans recent client messages for explicit date/time signals.
 * Returns { valid: true } if a real time was given, or { valid: false, reason } to override.
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
    /\b\d{1,2}:\d{2}\b/,                          // 3:00, 15:00
    /\b\d{1,2}\s*(am|pm|AM|PM)\b/,                 // 3pm, 10 AM
    /\b(noon|midnight)\b/i,
    /\b(morning|afternoon|evening)\b/i,
    /\b(today|tonight|tomorrow|tmrw)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(next\s+week|this\s+week|next\s+month)\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\b/i,
    /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/,   // 3/15, 03-15-2026
    /\bat\s+\d{1,2}\b/i,                            // "at 3", "at 10"
  ];

  const hasTimeSignal = timePatterns.some(pattern => pattern.test(recentClientMessages));

  if (!hasTimeSignal) {
    console.warn('🛡️ Guardrail: book_calendar blocked — no date/time found in client messages');
    return {
      valid: false,
      overrideReason: 'Client expressed interest in scheduling but has not yet provided a specific date or time. Ask the client for their preferred day and time for a viewing.',
    };
  }

  return { valid: true };
}

/**
 * PHASE 4: THE JUDGE
 * Deterministic check — extract street addresses from the AI response and verify
 * they exist in the known properties list. No LLM call needed.
 */
export async function verifyResponseHallucinations(
  responseText: string,
  properties: Property[]
): Promise<VerificationResult> {
  console.log('⚖️ AI Judge: Verifying hallucinations (deterministic)...');

  if (!properties.length) {
    return { hasHallucinations: false, hallucinatedAddresses: [] };
  }

  const knownAddresses = properties.map(p => (p.address || '').toLowerCase().trim());

  const addressPattern = /\b\d{1,6}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Way|Pl|Place|Cir|Circle|Pkwy|Parkway|Ter|Terrace|Loop|Trail|Run|Pass)\b\.?/gi;

  const foundAddresses = responseText.match(addressPattern) || [];
  const hallucinatedAddresses: string[] = [];

  for (const addr of foundAddresses) {
    const normalized = addr.toLowerCase().trim().replace(/\.$/, '');
    const isKnown = knownAddresses.some(known =>
      known.includes(normalized) || normalized.includes(known.split(',')[0].trim())
    );
    if (!isKnown) {
      hallucinatedAddresses.push(addr);
    }
  }

  if (hallucinatedAddresses.length > 0) {
    console.warn('🚨 Hallucinated addresses found:', hallucinatedAddresses);
  }

  return {
    hasHallucinations: hallucinatedAddresses.length > 0,
    hallucinatedAddresses,
    reason: hallucinatedAddresses.length > 0
      ? `Found ${hallucinatedAddresses.length} address(es) not in property list: ${hallucinatedAddresses.join(', ')}`
      : undefined,
  };
}
