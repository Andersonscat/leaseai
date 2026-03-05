import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdByGmailEmail } from '@/lib/oauth-tokens';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.message || !body.message.data) {
      console.log('⚠️ Valid webhook received but no message data');
      return NextResponse.json({ status: 'ignored' });
    }

    const data = Buffer.from(body.message.data, 'base64').toString().trim();
    const notification = JSON.parse(data);

    console.log('🔔 Gmail Webhook Received:', {
      emailAddress: notification.emailAddress,
      historyId: notification.historyId,
    });

    // Look up the user who owns this Gmail address
    const userId = await getUserIdByGmailEmail(notification.emailAddress);

    if (!userId) {
      console.warn('⚠️ Webhook: No user found for email:', notification.emailAddress);
      return NextResponse.json({ status: 'no_user' });
    }

    // Fetch the user object for sync-service
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error('❌ Webhook: Failed to load user:', userError);
      return NextResponse.json({ status: 'user_error' });
    }

    console.log('👤 Syncing for user:', user.email);

    const { syncGmailMessages } = await import('@/lib/sync-service');
    const result = await syncGmailMessages(supabaseAdmin as any, user as any);

    console.log('✅ Webhook sync result:', result);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
