
import { NextRequest, NextResponse } from 'next/server';
import { getRecentUnreadMessages, sendAutoReply } from '@/lib/gmail';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (reusing existing env var)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Verify message format
    if (!body.message || !body.message.data) {
      console.log('⚠️ Valid webhook received but no message data');
      return NextResponse.json({ status: 'ignored' });
    }

    // 2. Decode Pub/Sub message
    const data = Buffer.from(body.message.data, 'base64').toString().trim();
    const notification = JSON.parse(data);

    console.log('🔔 Gmail Webhook Received:', {
      emailAddress: notification.emailAddress,
      historyId: notification.historyId
    });

    // 3. Trigger Sync Logic
    console.log('🔄 Triggering immediate email sync...');
    
    // Initialize Supabase Admin (Bypass RLS)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
    );
    
    // 4. Find the user context (Using Auth Admin)
    // We need a valid user to run the sync as.
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (userError || !users || users.length === 0) {
       console.error('❌ Webhook: No user found to sync. Error:', userError);
       return NextResponse.json({ status: 'no_user' });
    }

    const user = users[0];
    console.log('👤 Syncing for user:', user.email);
    
    // Call shared sync service
    const { syncGmailMessages } = await import('@/lib/sync-service');
    const result = await syncGmailMessages(supabase, user as any); // Cast to User type

    console.log('✅ Webhook sync result:', result);

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
