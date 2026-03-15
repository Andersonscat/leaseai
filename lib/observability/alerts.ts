import logger from './logger';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const recentAlerts = new Map<string, number>();
const DEDUP_WINDOW_MS = 300_000; // 5 minutes

/**
 * Send an alert to Telegram. Deduplicates by key within a 5-minute window.
 */
export async function sendAlert(params: {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  dedupeKey?: string;
}): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.debug({ title: params.title }, 'Alert skipped (Telegram not configured)');
    return;
  }

  if (params.dedupeKey) {
    const lastSent = recentAlerts.get(params.dedupeKey);
    if (lastSent && Date.now() - lastSent < DEDUP_WINDOW_MS) {
      return; // skip duplicate
    }
    recentAlerts.set(params.dedupeKey, Date.now());
  }

  const emoji = params.severity === 'critical' ? '🔴' : params.severity === 'warning' ? '⚠️' : 'ℹ️';
  const text = `${emoji} *${params.title}*\n\n${params.message}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    logger.warn({ err, title: params.title }, 'Failed to send Telegram alert');
  }
}

/**
 * Alert: AI error rate is high
 */
export async function alertHighErrorRate(errorCount: number, totalCount: number): Promise<void> {
  const rate = Math.round((errorCount / totalCount) * 100);
  if (rate < 10) return;

  await sendAlert({
    title: 'AI Error Rate High',
    message: `Error rate: ${rate}%\nLast period: ${errorCount} errors / ${totalCount} calls\n→ Check /dashboard/admin`,
    severity: rate > 25 ? 'critical' : 'warning',
    dedupeKey: 'ai_error_rate',
  });
}

/**
 * Alert: Gmail sync failed
 */
export async function alertGmailSyncFailed(userEmail: string, error: string): Promise<void> {
  await sendAlert({
    title: 'Gmail Sync Failed',
    message: `User: ${userEmail}\nError: ${error}\n→ Check /dashboard/admin`,
    severity: 'warning',
    dedupeKey: `gmail_sync_${userEmail}`,
  });
}

/**
 * Alert: Hallucination blocked
 */
export async function alertHallucinationBlocked(tenantName: string, reason: string): Promise<void> {
  await sendAlert({
    title: 'Hallucination Blocked',
    message: `Tenant: ${tenantName}\nReason: ${reason}`,
    severity: 'info',
    dedupeKey: `hallucination_${tenantName}`,
  });
}

// Cleanup old dedup entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, time] of recentAlerts) {
      if (now - time > DEDUP_WINDOW_MS) recentAlerts.delete(key);
    }
  }, 600_000);
}
