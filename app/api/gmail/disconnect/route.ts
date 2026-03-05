import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deleteOAuthTokens, getOAuthTokens } from '@/lib/oauth-tokens';
import { google } from 'googleapis';

export async function DELETE(req: NextRequest) {
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

    // Try to revoke the token with Google before deleting
    const tokens = await getOAuthTokens(user.id);
    if (tokens?.refresh_token) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        await oauth2Client.revokeToken(tokens.refresh_token);
        console.log('✅ Google token revoked for user:', user.id);
      } catch (err) {
        console.warn('⚠️ Failed to revoke Google token (non-blocking):', err);
      }
    }

    await deleteOAuthTokens(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting Gmail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
