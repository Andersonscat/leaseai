import { NextResponse } from 'next/server';
import { getRecentUnreadMessages } from '@/lib/gmail';
import { generateQualificationResponse } from '@/lib/ai-qualification';
import { getGmailClient } from '@/lib/gmail'; // We need direct access to fetch message body if generic helper hides it

/**
 * DEBUG AGENT ENDPOINT
 * Manually runs the AI Agent on the latest unread email to see what happens.
 */
export async function GET() {
  const logs: string[] = [];
  const log = (msg: string, data?: any) => {
    console.log(msg, data || '');
    logs.push(msg + (data ? ' ' + JSON.stringify(data, null, 2) : ''));
  };

  try {
    log('🚀 Starting Debug Agent...');
    
    // 1. Fetch latest unread message directly
    log('📧 Fetching latest email from Gmail...');
    const gmail = getGmailClient();
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 1
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      log('⚠️ No unread messages found!');
      return NextResponse.json({ status: 'no_unread', logs });
    }

    const messageId = response.data.messages[0].id!;
    log(`📨 Found message ID: ${messageId}`);

    // Fetch full message details
    const msgDetail = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full' // or 'metadata' if we just need headers, but we need body
    });
    
    const snippet = msgDetail.data.snippet;
    const headers = msgDetail.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value;
    const from = headers?.find(h => h.name === 'From')?.value;
    
    log(`📝 Email Details:`, { subject, from, snippet });

    // 2. Prepare Context for AI
    // Mock tenant/properties data for simplicity
    const mockContext = {
      tenant: {
        name: from?.split('<')[0].trim() || 'Client',
        email: 'assylzhaninternational@gmail.com', // Force your email for safety
        qualification_status: 'qualifying' as const
      },
      properties: [{
        id: 'mock-prop-1',
        address: '123 Main St, Seattle, WA',
        price: '$2,500',
        bedrooms: 2,
        status: 'Available'
      }],
      conversationHistory: [
        { role: 'user' as const, content: snippet || "3pm works for me" } 
      ]
    };

    log('🤖 Calling AI Agent...');
    
    // 3. Run AI Logic
    const aiResult = await generateQualificationResponse(mockContext);
    
    log('✅ AI Result:', aiResult);

    // 4. Handle Function Call if present
    if (aiResult.needsFunctionExecution && aiResult.functionCall) {
        log('🛠️ Function Execution Requested:', aiResult.functionCall);
        
        if (aiResult.functionCall.name === 'book_calendar_event') {
            log('📅 Booking Calendar Event...');
            const { createCalendarEvent } = await import('@/lib/calendar-client');
            const { start_time, duration_minutes, property_address } = aiResult.functionCall.args;
            
            // Calculate end time
            const startDate = new Date(start_time);
            const endDate = new Date(startDate.getTime() + (duration_minutes || 30) * 60 * 1000);
            
            log(`🕒 Booking from ${startDate.toISOString()} to ${endDate.toISOString()}`);
            
            const event = await createCalendarEvent(
                startDate.toISOString(),
                endDate.toISOString(),
                `Viewing: ${property_address}`,
                `Created by Debug Agent`,
                mockContext.tenant.email
            );
            
            log(`✅ Calendar Event Created! Link: ${event.htmlLink}`);
            
            // Generate final response
            log('🗣️ Generating final response...');
             const { generateResponseAfterFunction } = await import('@/lib/ai-qualification');
             const finalResponse = await generateResponseAfterFunction({
                  tenant: mockContext.tenant,
                  conversationHistory: mockContext.conversationHistory,
                  functionResult: {
                    success: true,
                    calendar_link: event.htmlLink || undefined,
                    event_time: start_time
                  }
             });
             
             log('🏁 Final AI Response:', finalResponse);
             
             return NextResponse.json({ 
                 status: 'success', 
                 action: 'booked_calendar',
                 finalResponse,
                 logs 
             });
        }
    }

    return NextResponse.json({ 
        status: 'success', 
        action: 'response_only', 
        aiResult, 
        logs 
    });

  } catch (error: any) {
    log('❌ ERROR:', error.message);
    console.error(error);
    return NextResponse.json({ status: 'error', error: error.message, logs }, { status: 500 });
  }
}
