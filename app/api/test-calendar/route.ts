import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar-client';

/**
 * Test endpoint to verify Google Calendar integration.
 * Uses the legacy GMAIL_REFRESH_TOKEN env var (debug-only).
 * GET /api/test-calendar
 */
export async function GET() {
  try {
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No GMAIL_REFRESH_TOKEN env var' }, { status: 503 });
    }

    console.log('Testing Google Calendar event creation...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    const startTimeStr = `${dateStr}T15:00:00`;
    const endTimeStr = `${dateStr}T15:30:00`;

    const event = await createCalendarEvent(
      refreshToken,
      startTimeStr,
      endTimeStr,
      'TEST: Property Viewing (3 PM Pacific)',
      `Test viewing appointment created by LeaseAI system.\nTest Time: ${new Date().toISOString()}`,
      'test@example.com'
    );

    console.log('Test event created successfully!');

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully!',
      event: {
        id: event.id,
        htmlLink: event.htmlLink,
        summary: event.summary,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        created: event.created,
        status: event.status,
      },
    });
  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || error.stack,
    }, { status: 500 });
  }
}
