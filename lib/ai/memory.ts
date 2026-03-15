import { SupabaseClient } from '@supabase/supabase-js';
import { geminiModel, generateContentWithRetry } from '@/lib/gemini-client';
import { aiLogger } from '@/lib/observability';

const log = aiLogger.child({ module: 'memory' });

const SUMMARY_THRESHOLD = 15;
const RECENT_MESSAGES_COUNT = 8;

const SUMMARIZATION_PROMPT = `You are a conversation summarizer for a real estate AI assistant.

Given a conversation between a client (user) and a real estate agent (assistant), produce a concise structured summary.

RULES:
- Write in the SAME language as the conversation (Russian → Russian, English → English)
- Keep ONLY actionable information, drop greetings/pleasantries
- 200-400 words max
- Use bullet points

STRUCTURE:
**Client Profile:**
- Name, contact info mentioned
- Budget, bedrooms, move-in date, pets, occupants
- Location preferences, must-haves, deal-breakers

**Properties Discussed:**
- Which properties were shown, client reactions (liked/disliked/why)
- Viewings booked or discussed (dates, addresses)

**Key Decisions & Agreements:**
- What was agreed on, what was promised
- Pending actions (checking with landlord, sending more options, etc.)

**Open Questions:**
- Unanswered client questions
- Information still needed from the client

**Conversation Tone:**
- One sentence: overall sentiment and urgency level

Now summarize this conversation:`;

export interface ConversationSummary {
  summary: string;
  messagesCovered: number;
  lastMessageAt: string;
}

/**
 * Load existing summary + recent messages for a tenant conversation.
 * Returns { summary, recentMessages } ready for AI context.
 */
export async function loadConversationMemory(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
): Promise<{
  summary: string | null;
  recentMessages: { message_text: string; sender_type: string; created_at: string }[];
  totalMessages: number;
}> {
  const [summaryRes, countRes, recentRes] = await Promise.all([
    supabase
      .from('conversation_summaries')
      .select('summary, messages_covered, last_message_at')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle(),

    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId),

    supabase
      .from('messages')
      .select('message_text, sender_type, created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(RECENT_MESSAGES_COUNT),
  ]);

  const totalMessages = countRes.count ?? 0;
  const recentMessages = (recentRes.data ?? []).reverse();
  const summary = summaryRes.data?.summary ?? null;

  return { summary, recentMessages, totalMessages };
}

/**
 * Summarize older messages and save to DB.
 * Called after AI response when message count exceeds threshold.
 */
export async function summarizeConversationIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('conversation_summaries')
    .select('messages_covered')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const messagesCovered = existing?.messages_covered ?? 0;

  const { count: totalCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  const total = totalCount ?? 0;

  if (total <= SUMMARY_THRESHOLD) {
    return false;
  }

  const newMessagesSinceSummary = total - messagesCovered;
  if (newMessagesSinceSummary < RECENT_MESSAGES_COUNT) {
    return false;
  }

  log.info({ tenantId, total, messagesCovered, newMessages: newMessagesSinceSummary }, 'Summarizing conversation');

  const messagesToSummarize = total - RECENT_MESSAGES_COUNT;

  const { data: messages } = await supabase
    .from('messages')
    .select('message_text, sender_type, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(messagesToSummarize);

  if (!messages || messages.length === 0) {
    return false;
  }

  const conversationText = messages.map(m => {
    const role = m.sender_type === 'tenant' ? 'Client' : 'Agent';
    const text = cleanForSummary(m.message_text);
    return `[${role}]: ${text}`;
  }).join('\n\n');

  try {
    const result = await generateContentWithRetry(geminiModel, [
      { text: `${SUMMARIZATION_PROMPT}\n\n${conversationText}` },
    ]);

    const summary = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary || summary.length < 50) {
      log.warn({ tenantId }, 'Summary too short, skipping save');
      return false;
    }

    const lastMessage = messages[messages.length - 1];

    const { error } = await supabase
      .from('conversation_summaries')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        summary,
        messages_covered: messages.length,
        last_message_at: lastMessage.created_at,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,tenant_id',
      });

    if (error) {
      log.error({ error, tenantId }, 'Failed to save conversation summary');
      return false;
    }

    log.info({ tenantId, messagesSummarized: messages.length, summaryLength: summary.length }, 'Conversation summary saved');
    return true;
  } catch (err) {
    log.error({ err, tenantId }, 'Summarization LLM call failed');
    return false;
  }
}

/**
 * Strip property JSON blocks, email signatures, and excessive whitespace
 */
function cleanForSummary(text: string): string {
  if (!text) return '';
  return text
    .replace(/---PROPERTIES_JSON---[\s\S]*?---END_PROPERTIES_JSON---/g, '[property cards sent]')
    .replace(/--\s*\n[\s\S]{0,200}$/m, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1500);
}
