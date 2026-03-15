import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdByGmailEmail } from '@/lib/oauth-tokens';
import { gmailLogger, recordSystemEvent, generateTraceId } from '@/lib/observability';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const traceId = generateTraceId();
  const log = gmailLogger.child({ traceId });
  const startedAt = Date.now();

  try {
    const body = await req.json();

    if (!body.message || !body.message.data) {
      log.debug('Webhook received but no message data');
      return NextResponse.json({ status: 'ignored' });
    }

    const data = Buffer.from(body.message.data, 'base64').toString().trim();
    const notification = JSON.parse(data);

    log.info({ email: notification.emailAddress, historyId: notification.historyId }, 'Gmail webhook received');

    const userId = await getUserIdByGmailEmail(notification.emailAddress);

    if (!userId) {
      log.warn({ email: notification.emailAddress }, 'No user found for email');
      return NextResponse.json({ status: 'no_user' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      log.error({ err: userError, userId }, 'Failed to load user');
      return NextResponse.json({ status: 'user_error' });
    }

    log.info({ userId, userEmail: user.email }, 'Starting sync for user');

    const { syncGmailMessages } = await import('@/lib/sync-service');
    const result = await syncGmailMessages(supabaseAdmin as any, user as any);

    await recordSystemEvent({
      traceId,
      userId,
      eventType: 'gmail_webhook',
      status: 'success',
      metadata: { email: notification.emailAddress, synced: result.synced, autoReplies: result.autoRepliesSent },
      latencyMs: Date.now() - startedAt,
    });

    log.info({ result, latencyMs: Date.now() - startedAt }, 'Webhook sync complete');

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    log.error({ err: error, latencyMs: Date.now() - startedAt }, 'Webhook error');
    await recordSystemEvent({
      traceId,
      eventType: 'gmail_webhook',
      status: 'error',
      error: error?.message,
      latencyMs: Date.now() - startedAt,
    });
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
