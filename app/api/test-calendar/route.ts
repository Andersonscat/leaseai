import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar-client';

/**
 * Test endpoint to verify Google Calendar integration
 * GET /api/test-calendar
 */
export async function GET() {
  try {
    console.log('🧪 Testing Google Calendar event creation...');
    
    // Create a test event for tomorrow at 3 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0); // 3 PM
    
    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30); // 30-minute meeting
    
    const event = await createCalendarEvent(
      tomorrow.toISOString(),
      endTime.toISOString(),
      'TEST: Property Viewing',
      `This is a test viewing appointment created by LeaseAI system.\n\nTest Time: ${new Date().toISOString()}`,
      'assylzhaninternational@gmail.com' // Your email for testing
    );
    
    console.log('✅ Test event created successfully!');
    console.log('📅 Event link:', event.htmlLink);
    console.log('📧 Attendees:', event.attendees);
    
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
        status: event.status
      }
    });
    
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || error.stack
    }, { status: 500 });
  }
}
