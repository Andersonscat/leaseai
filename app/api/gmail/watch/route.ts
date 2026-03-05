import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { watchInbox } from '@/lib/gmail';
import { getOAuthTokens } from '@/lib/oauth-tokens';

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Watch endpoint is reachable' });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await getOAuthTokens(user.id);
    if (!tokens) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    const result = await watchInbox(tokens.refresh_token);

    console.log('✅ Gmail Watch Started:', result);

    return NextResponse.json({
      success: true,
      historyId: result.historyId,
      expiration: result.expiration,
    });
  } catch (error: any) {
    console.error('❌ Error setting up Gmail watch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup Gmail watch' },
      { status: 500 }
    );
  }
}
