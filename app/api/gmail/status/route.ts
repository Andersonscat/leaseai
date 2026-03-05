import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOAuthTokens } from '@/lib/oauth-tokens';

export async function GET(req: NextRequest) {
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

    // Check shared OAuth app credentials
    const missingCreds: string[] = [];
    if (!process.env.GOOGLE_CLIENT_ID) missingCreds.push('GOOGLE_CLIENT_ID');
    if (!process.env.GOOGLE_CLIENT_SECRET) missingCreds.push('GOOGLE_CLIENT_SECRET');
    if (!process.env.GOOGLE_REDIRECT_URI) missingCreds.push('GOOGLE_REDIRECT_URI');

    if (missingCreds.length > 0) {
      return NextResponse.json({
        status: {
          configured: false,
          connected: false,
          ready: false,
          gmail_email: null,
          message: `Missing credentials: ${missingCreds.join(', ')}`,
        },
      });
    }

    // Check per-user token in DB
    const tokens = await getOAuthTokens(user.id);

    if (!tokens) {
      return NextResponse.json({
        status: {
          configured: true,
          connected: false,
          ready: false,
          gmail_email: null,
          message: 'Gmail not connected. Click "Connect Gmail" to set up.',
        },
      });
    }

    return NextResponse.json({
      status: {
        configured: true,
        connected: true,
        ready: true,
        gmail_email: tokens.gmail_email,
        message: tokens.gmail_email
          ? `Connected as ${tokens.gmail_email}`
          : 'Gmail connected',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check Gmail status' },
      { status: 500 }
    );
  }
}
