import { NextRequest, NextResponse } from 'next/server';
import { unifiedEmailProcessor } from '@/lib/ai-email-parser';
import { generateFinalResponse, formatBookingDetails } from '@/lib/ai-qualification';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { from, subject, body } = await req.json();

    if (!from || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🧪 Sandbox: Simulating email from', from);

    // 1. Classification & Extraction (Unified)
    const lead = await unifiedEmailProcessor(from, subject, body);

    if (!lead) {
      return NextResponse.json({
        isLead: false,
        reason: 'AI model returned null — this is likely a Gemini rate limit (429) or API error. Try again in a few seconds.',
        diagnostic: null
      });
    }

    if (!lead.isLead) {
      return NextResponse.json({
        isLead: false,
        reason: lead.reason || 'Not classified as a lead',
        diagnostic: lead
      });
    }

    // 2. Generate Simulated Response
    // We need some mock properties for the context
    const mockProperties: any[] = [
      { id: 'p1', address: '123 Main St, Seattle, WA', price: '$2,500/mo', bedrooms: 2, status: 'available' },
      { id: 'p2', address: '456 Oak Ave, Seattle, WA', price: '$3,200/mo', bedrooms: 3, status: 'available' }
    ];

    const context = {
      tenant: { name: lead.tenant_name || 'Prospect', email: lead.tenant_email || from },
      properties: mockProperties,
      conversationHistory: [],
      realtorName: 'LeaseAI Sandbox Agent',
    };

    // Simulated Analysis based on the lead result
    const mockAnalysis = {
      action: lead.intent === 'viewing' ? 'book_calendar' : 'answer_question',
      action_params: {
        property_address: lead.property_address || mockProperties[0].address,
        start_time: lead.move_in_date || new Date().toISOString()
      }
    };

    const mockEventTime = mockAnalysis.action_params.start_time;
    const aiResponseText = await generateFinalResponse(context, mockAnalysis as any, { 
      success: true, 
      data: { 
        htmlLink: 'https://calendar.google.com/sandbox-link',
        start: { dateTime: mockEventTime }
      } 
    });

    // 3. Attach Formatted Details (if booking)
    let finalResponse = aiResponseText;
    let bookingDetails = null;

    if (mockAnalysis.action === 'book_calendar') {
       bookingDetails = formatBookingDetails({
         address: mockAnalysis.action_params.property_address,
         calendarLink: 'https://calendar.google.com/sandbox-link',
         eventTime: mockAnalysis.action_params.start_time,
         realtorName: context.realtorName,
         realtorPhone: '+1 (555) 000-0000'
       });
       finalResponse = `${aiResponseText}\n\n\n${bookingDetails}`;
    }

    return NextResponse.json({
      isLead: true,
      classification: lead,
      aiResponse: finalResponse,
      rawAiText: aiResponseText,
      bookingDetails: bookingDetails,
      contextUsed: {
        propertiesCount: mockProperties.length,
        detectedIntent: lead.intent
      }
    });

  } catch (error: any) {
    console.error('❌ Sandbox Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
