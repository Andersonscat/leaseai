
import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail';


export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'Watch endpoint is reachable' });
}

export async function POST(req: NextRequest) {
  try {
    const gmail = getGmailClient();

    // Setup the watch (subscribe to Push Notifications)
    // We need to specify the topic name created in Google Cloud Console
    // Format: projects/PROJECT_ID/topics/TOPIC_NAME
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;

    if (!topicName) {
      return NextResponse.json(
        { error: 'GMAIL_PUBSUB_TOPIC environment variable is not set' },
        { status: 500 }
      );
    }

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: topicName,
        labelIds: ['INBOX'], // Only watch Inbox
      },
    });

    console.log('✅ Gmail Watch Started:', response.data);

    return NextResponse.json({
      success: true,
      historyId: response.data.historyId,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('❌ Error setting up Gmail watch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup Gmail watch' },
      { status: 500 }
    );
  }
}
