import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { upsertOAuthTokens } from '@/lib/oauth-tokens';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user_id

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?tab=account&accountTab=channels&gmail_error=no_code', req.url)
      );
    }

    if (!state) {
      return NextResponse.redirect(
        new URL('/dashboard?tab=account&accountTab=channels&gmail_error=no_state', req.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/dashboard?tab=account&accountTab=channels&gmail_error=no_refresh_token', req.url)
      );
    }

    // Fetch the connected Gmail address
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const gmailEmail = userInfo.email || null;

    // Store tokens in DB
    await upsertOAuthTokens(state, {
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      scope: tokens.scope ?? null,
      gmail_email: gmailEmail,
    });

    console.log('✅ OAuth tokens stored for user:', state, 'email:', gmailEmail);

    return NextResponse.redirect(
      new URL('/dashboard?tab=account&accountTab=channels&gmail_connected=true', req.url)
    );
  } catch (error: any) {
    console.error('Error in Gmail callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?tab=account&accountTab=channels&gmail_error=${encodeURIComponent(error.message || 'unknown')}`, req.url)
    );
  }
}
