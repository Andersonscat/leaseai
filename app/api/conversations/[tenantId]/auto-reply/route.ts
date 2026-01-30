import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  calculateLeadScore,
  getLeadQuality,
  matchProperties,
  analyzeConversation,
  generateFinalResponse 
} from '@/lib/ai-qualification';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Проверяем авторизацию
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.tenantId;

    console.log('🤖 Generating smart AI response for tenant:', tenantId);

    // 1. Get tenant data (all qualification info)
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      console.error('Error fetching tenant:', tenantError);
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // 2. Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('message_text, sender_type')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(10);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    const conversationHistory =
      messages?.map((msg) => ({
        role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
        content: msg.message_text,
      })) || [];

    // 3. Get realtor's available properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['Active', 'Available']); // ← Support both statuses

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
    }
    
    // 🚨 DEBUG: Log what properties AI sees
    console.log('🏠 Properties for AI generation:', {
      count: properties?.length || 0,
      properties: properties?.map(p => ({
        address: p.address,
        price: p.price,
        beds: p.beds,
        status: p.status,
      })),
    });

    // 4. Get realtor info
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    const realtorName = userData?.email?.split('@')[0] || 'Realtor';

    // 5. NEW: Agentic Workflow
    // 5.1 Analyze
    const analysis = await analyzeConversation({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        qualification_status: tenant.qualification_status as any,
      },
      properties: properties || [],
      conversationHistory,
      realtorName,
    });

    console.log('✅ Analysis complete:', analysis.action);

    // 5.2 Execute Actions
    let executionResult: { success: boolean; data?: any; error?: string } = { success: true };
    
    if (analysis.action === 'book_calendar' && analysis.action_params) {
      console.log('📅 Action: Booking Calendar...');
      try {
         const { createCalendarEvent } = await import('@/lib/calendar-client');
         const args = analysis.action_params;
         const startTime = new Date(args.start_time);
         const duration = args.duration_minutes || 30;
         const endTime = new Date(startTime.getTime() + duration * 60000);
         
         const event = await createCalendarEvent(
            startTime.toISOString(),
            endTime.toISOString(),
            `Viewing: ${args.property_address}`,
            `Client: ${args.client_name || tenant.name}\nPhone: ${tenant.phone}\nEmail: ${tenant.email}`,
            tenant.email || undefined
         );
         
         executionResult = { success: true, data: event };
         // We should also save appointment to DB here if needed, consistent with sync-service
      } catch (err: any) {
         console.error('❌ Calendar booking failed:', err);
         executionResult = { success: false, error: err.message };
      }
    }

    // 6. Update tenant with extracted data
    if (analysis.extractedData && Object.keys(analysis.extractedData).length > 0) {
       // ... (Similar logic to before, applying extractedData) ...
       // For brevity, using the analysis.extractedData directly
       const updateData: any = { ...analysis.extractedData };
       
       const updatedTenant = { ...tenant, ...analysis.extractedData };
       // Recalculate score
       const newScore = calculateLeadScore(updatedTenant);
       const newQuality = getLeadQuality(newScore);
       updateData.lead_score = newScore;
       updateData.lead_quality = newQuality;
       
       // Update in DB
       await supabase.from('tenants').update(updateData).eq('id', tenantId);
    }

    // 7. Find matches
    let matchedProperties: any[] = [];
    if (tenant.lead_quality === 'hot' || tenant.lead_quality === 'warm') {
      matchedProperties = matchProperties(tenant as any, properties || []);
    }

    // 8. Generate Final Response
    const finalResponse = await generateFinalResponse(
        {
          tenant: { name: tenant.name, email: tenant.email },
          properties: properties || [],
          conversationHistory,
          realtorName
        },
        analysis,
        executionResult
    );

    return NextResponse.json({
      success: true,
      aiResponse: finalResponse,
      extractedData: analysis.extractedData,
      leadScore: tenant.lead_score, // Simplified re-fetch or use updated
      leadQuality: tenant.lead_quality,
      matchedProperties: matchedProperties.slice(0, 3),
      nextAction: analysis.action,
    });
    
  } catch (error) {
    console.error('❌ Error in auto-reply endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
