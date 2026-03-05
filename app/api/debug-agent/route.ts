import { NextResponse } from 'next/server';
import { analyzeConversation, generateFinalResponse } from '@/lib/ai-qualification';
import { getGmailClient } from '@/lib/gmail';

/**
 * DEBUG AGENT ENDPOINT
 * Manually runs the AI Agent on the latest unread email to see what happens.
 * Uses the legacy GMAIL_REFRESH_TOKEN env var (debug-only, not multi-user).
 */
export async function GET() {
  const logs: string[] = [];
  const log = (msg: string, data?: any) => {
    console.log(msg, data || '');
    logs.push(msg + (data ? ' ' + JSON.stringify(data, null, 2) : ''));
  };

  try {
    log('Starting Debug Agent...');

    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (!refreshToken) {
      return NextResponse.json({ status: 'error', error: 'No GMAIL_REFRESH_TOKEN env var set', logs }, { status: 503 });
    }

    log('Fetching latest email from Gmail...');
    const gmail = getGmailClient(refreshToken);
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 1,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      log('No unread messages found!');
      return NextResponse.json({ status: 'no_unread', logs });
    }

    const messageId = response.data.messages[0].id!;
    log(`Found message ID: ${messageId}`);

    const msgDetail = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const snippet = msgDetail.data.snippet;
    const headers = msgDetail.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value;
    const from = headers?.find(h => h.name === 'From')?.value;

    log('Email Details:', { subject, from, snippet });

    const mockContext = {
      tenant: {
        name: from?.split('<')[0].trim() || 'Client',
        email: 'debug@test.com',
        qualification_status: 'qualifying' as const,
      },
      properties: [{
        id: 'mock-prop-1',
        address: '123 Main St, Seattle, WA',
        price: '$2,500',
        bedrooms: 2,
        status: 'Available',
      }],
      conversationHistory: [
        { role: 'user' as const, content: snippet || '3pm works for me' },
      ],
    };

    log('Calling AI Agent...');

    const analysis = await analyzeConversation(mockContext);
    log('AI Analysis:', analysis);

    let executionResult: { success: boolean; data?: any; error?: string } = { success: true };

    if (analysis.action === 'book_calendar' && analysis.action_params) {
      log('Booking Calendar Event...');
      try {
        const { createCalendarEvent } = await import('@/lib/calendar-client');
        const { start_time, duration_minutes, property_address } = analysis.action_params;

        const startDate = new Date(start_time);
        const endDate = new Date(startDate.getTime() + (duration_minutes || 30) * 60 * 1000);

        const event = await createCalendarEvent(
          refreshToken,
          startDate.toISOString(),
          endDate.toISOString(),
          `Viewing: ${property_address}`,
          'Created by Debug Agent',
          mockContext.tenant.email
        );

        log(`Calendar Event Created! Link: ${event.htmlLink}`);
        executionResult = { success: true, data: event };
      } catch (err: any) {
        log('Booking Failed:', err.message);
        executionResult = { success: false, error: err.message };
      }
    }

    log('Generating final response...');
    const finalResponse = await generateFinalResponse(
      {
        tenant: mockContext.tenant,
        properties: mockContext.properties,
        conversationHistory: mockContext.conversationHistory,
        realtorName: 'DebugAgent',
      },
      analysis,
      executionResult
    );

    log('Final AI Response:', finalResponse);

    return NextResponse.json({
      status: 'success',
      action: analysis.action,
      finalResponse,
      logs,
    });
  } catch (error: any) {
    log('ERROR:', error.message);
    console.error(error);
    return NextResponse.json({ status: 'error', error: error.message, logs }, { status: 500 });
  }
}
