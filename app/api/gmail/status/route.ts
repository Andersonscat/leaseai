import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to check Gmail API configuration
 * Helps debug OAuth issues
 */
export async function GET() {
  try {
    const status = {
      configured: false,
      missing: [] as string[],
      ready: false,
      message: '',
    };

    // Check required environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
      status.missing.push('GOOGLE_CLIENT_ID');
    }
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      status.missing.push('GOOGLE_CLIENT_SECRET');
    }
    
    if (!process.env.GOOGLE_REDIRECT_URI) {
      status.missing.push('GOOGLE_REDIRECT_URI');
    }
    
    if (!process.env.GMAIL_REFRESH_TOKEN) {
      status.missing.push('GMAIL_REFRESH_TOKEN (optional for now)');
    }

    // Determine status
    if (status.missing.length === 0) {
      status.configured = true;
      status.ready = true;
      status.message = '✅ Gmail API is configured! You can use Sync Gmail.';
    } else if (status.missing.length === 1 && status.missing[0].includes('REFRESH_TOKEN')) {
      status.configured = true;
      status.ready = false;
      status.message = '⚠️ OAuth configured, but no refresh token. You need to complete OAuth flow first.';
    } else {
      status.configured = false;
      status.ready = false;
      status.message = `❌ Missing credentials: ${status.missing.join(', ')}. See GMAIL_QUICK_SETUP.md`;
    }

    return NextResponse.json({
      status,
      help: {
        documentation: '/Users/assylzhantati/Downloads/realtoros/GMAIL_QUICK_SETUP.md',
        steps: [
          '1. Get Google OAuth credentials from https://console.cloud.google.com/',
          '2. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local',
          '3. Restart server: npm run dev',
          '4. For now, use "New Conversation" to add leads manually',
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check Gmail status',
      },
      { status: 500 }
    );
  }
}
