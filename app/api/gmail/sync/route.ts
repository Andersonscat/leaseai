import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRecentMessages, sendAutoReply } from '@/lib/gmail';
// import { generateQualificationResponse } from '@/lib/ai-qualification';

// Global sync lock to prevent concurrent syncs
const syncLocks = new Map<string, boolean>();

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call shared sync service
    const { syncGmailMessages } = await import('@/lib/sync-service');
    const result = await syncGmailMessages(supabase, user);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Gmail sync error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync Gmail',
      },
      { status: 500 }
    );
  }
}
