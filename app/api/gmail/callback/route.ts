import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log('✅ OAuth tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error: 'No refresh token received',
          message:
            'This can happen if you already authorized this app before. Try revoking access in Google Account settings and authorize again.',
          access_token: tokens.access_token ? 'received' : 'not received',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      refresh_token: tokens.refresh_token,
      message: 'Copy the refresh_token above and add it to your .env.local file as GMAIL_REFRESH_TOKEN',
    });
  } catch (error: any) {
    console.error('Error in Gmail callback:', error);
    return NextResponse.json(
      {
        error: 'Failed to exchange code for tokens',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
