import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversation, generateFinalResponse, verifyResponseHallucinations, ConversationContext, TenantData } from '@/lib/ai-qualification';

// Mock properties available in sandbox
const SANDBOX_PROPERTIES = [
  { 
    id: 'p1', 
    address: '123 Main St, Seattle, WA', 
    price: '$2,500/mo', 
    price_amount: 2500,
    bedrooms: 2, 
    status: 'available',
    description: 'Modern 2BR apartment in Capitol Hill. Open-plan living, updated kitchen, in-unit laundry, hardwood floors. Pet-friendly (cats & small dogs). Parking available (+$150/mo). Available immediately.',
    amenities: ['in-unit laundry', 'hardwood floors', 'updated kitchen', 'parking available'],
    pet_policy: 'small_dogs',
    available_from: '2026-02-01',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000',
  },
  { 
    id: 'p2', 
    address: '456 Oak Ave, Seattle, WA', 
    price: '$3,200/mo', 
    price_amount: 3200,
    bedrooms: 3, 
    status: 'available',
    description: 'Spacious 3BR townhouse in Queen Anne. Private backyard, 2 parking spots, rooftop deck. Great for families. No pets. Available March 1, 2026.',
    amenities: ['private backyard', '2 parking spots', 'rooftop deck'],
    pet_policy: 'no_pets',
    available_from: '2026-03-01',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000',
  },
  { 
    id: 'p3', 
    address: '789 Pine St, Seattle, WA', 
    price: '$1,800/mo', 
    price_amount: 1800,
    bedrooms: 1, 
    status: 'available',
    description: 'Cozy 1BR studio in Belltown. City views, gym access, doorman, pet-friendly. Walking distance to downtown. Available now.',
    amenities: ['city views', 'gym', 'doorman', 'concierge'],
    pet_policy: 'allowed',
    available_from: '2026-02-01',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory, tenantData } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build updated history with the new user message
    const updatedHistory: { role: 'user' | 'assistant'; content: string }[] = [
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Build TenantData from accumulated state
    const tenant: TenantData = {
      name: tenantData?.name || 'Sandbox Prospect',
      email: tenantData?.email || 'sandbox@test.com',
      source: 'sandbox',
      ...(tenantData || {}),
    };

    const context: ConversationContext = {
      tenant,
      properties: SANDBOX_PROPERTIES,
      conversationHistory: updatedHistory,
      realtorName: 'LeaseAI Agent',
      realtorPhone: '+1 (555) 000-0000',
    };

    // Phase 1: Analyze conversation and decide action
    const analysis = await analyzeConversation(context);

    // Phase 2: Generate response (sandbox - no real calendar booking)
    let executionResult = { success: false, data: undefined as any };
    
    if (analysis.action === 'book_calendar') {
      // Simulate a successful booking without hitting real calendar
      const bookingTime = analysis.action_params?.start_time || new Date().toISOString();
      executionResult = {
        success: true,
        data: {
          htmlLink: 'https://calendar.google.com/sandbox-preview-link',
          start: { dateTime: bookingTime }
        }
      };
    }

    let aiResponseText = await generateFinalResponse(
      context,
      analysis as any,
      executionResult.success 
        ? { success: true, data: executionResult.data }
        : { success: false }
    );

    const verification = await verifyResponseHallucinations(aiResponseText, SANDBOX_PROPERTIES);
    if (verification.hasHallucinations) {
      console.error('🚨 SANDBOX HALLUCINATION BLOCKED 🚨', verification.reason);
      aiResponseText = `Hi ${tenant.name}, I'm checking our database to confirm the availability and exact details of matching properties. I will get back to you shortly!`;
      analysis.action = 'reply';
    }

    // Simulate property json attachment for send_listing
    const listingAddresses = analysis.listing_addresses || [];
    let matchedProperties: any[] = [];
    if ((analysis.action === 'send_listing' || listingAddresses.length > 0) && SANDBOX_PROPERTIES.length) {
      matchedProperties = listingAddresses.length > 0
        ? SANDBOX_PROPERTIES.filter(p => listingAddresses.some(addr => p.address.toLowerCase().includes(addr.toLowerCase())))
        : (analysis.suggestedProperties?.length 
            ? SANDBOX_PROPERTIES.filter(p => analysis.suggestedProperties!.some(sp => p.address.toLowerCase().includes(sp.toLowerCase())))
            : SANDBOX_PROPERTIES.slice(0, 3));
    }

    if (matchedProperties.length > 0) {
       const cleanProps = matchedProperties.map(p => ({
         id: p.id,
         address: p.address,
         city: (p as any).city,
         state: (p as any).state,
         price: (p as any).price_monthly || (p as any).price_amount || p.price,
         beds: p.bedrooms,
         baths: (p as any).bathrooms,
         sqft: (p as any).sqft,
         type: (p as any).type,
         image: (p as any).images?.[0] || (p as any).image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'
       }));
       aiResponseText += `\n\n---PROPERTIES_JSON---\n${JSON.stringify(cleanProps)}\n---END_PROPERTIES_JSON---`;
    }

    // Build assistant reply
    const assistantMessage = { role: 'assistant' as const, content: aiResponseText };
    const newHistory = [...updatedHistory, assistantMessage];

    return NextResponse.json({
      reply: aiResponseText,
      analysis: {
        action: analysis.action,
        intent: analysis.intent,
        priority: analysis.priority,
        thought_process: analysis.thought_process,
        extractedData: analysis.extractedData,
        summary: analysis.summary,
        propertyMatches: analysis.propertyMatches,
      },
      conversationHistory: newHistory,
      simulatedBooking: analysis.action === 'book_calendar' ? {
        property: analysis.action_params?.property_address,
        time: analysis.action_params?.start_time,
        calendarLink: 'https://calendar.google.com/sandbox-preview-link',
      } : null,
    });

  } catch (error: any) {
    console.error('❌ Sandbox Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
