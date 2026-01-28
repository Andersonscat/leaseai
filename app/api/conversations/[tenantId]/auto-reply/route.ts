import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  generateQualificationResponse,
  calculateLeadScore,
  getLeadQuality,
  matchProperties 
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

    // 5. Generate smart qualification response
    const result = await generateQualificationResponse({
      tenant: tenant as any,
      properties: properties || [],
      conversationHistory,
      realtorName,
    });

    console.log('✅ Smart AI response generated:', {
      responseLength: result.response.length,
      extractedData: result.extractedData ? 'Yes' : 'No',
      suggestedProperties: result.suggestedProperties?.length || 0,
      nextAction: result.nextAction,
    });

    // 6. Update tenant with extracted data (if any)
    if (result.extractedData && Object.keys(result.extractedData).length > 0) {
      const updateData: any = { ...result.extractedData };
      
      // Calculate and update lead score
      const updatedTenant = { ...tenant, ...result.extractedData };
      const newScore = calculateLeadScore(updatedTenant);
      const newQuality = getLeadQuality(newScore);
      
      updateData.lead_score = newScore;
      updateData.lead_quality = newQuality;
      
      // Update qualification progress
      const progress = tenant.qualification_progress || {};
      if (result.extractedData.budget_min || result.extractedData.budget_max) {
        progress.financial = true;
      }
      if (result.extractedData.move_in_date) {
        progress.timeline = true;
      }
      if (result.extractedData.bedrooms || result.extractedData.property_type) {
        progress.property_requirements = true;
      }
      if (result.extractedData.preferred_neighborhoods) {
        progress.location = true;
      }
      if (result.extractedData.has_pets !== undefined) {
        progress.lifestyle = true;
      }
      updateData.qualification_progress = progress;
      
      // Determine qualification status
      const progressCount = Object.values(progress).filter(Boolean).length;
      if (progressCount >= 3 && newScore >= 6) {
        updateData.qualification_status = 'qualified';
      } else if (progressCount >= 1) {
        updateData.qualification_status = 'qualifying';
      }
      
      console.log('📊 Updating tenant data:', {
        newScore,
        newQuality,
        progressCount,
        status: updateData.qualification_status,
      });
      
      const { error: updateError } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating tenant:', updateError);
      } else {
        console.log('✅ Tenant data updated successfully');
      }
    }

    // 7. Find matching properties if tenant is qualified
    let matchedProperties: any[] = [];
    if (tenant.lead_quality === 'hot' || tenant.lead_quality === 'warm') {
      matchedProperties = matchProperties(tenant as any, properties || []);
      console.log(`🎯 Found ${matchedProperties.length} matching properties`);
    }

    // Return AI response + metadata
    // 5.5 Handle Function Calls (Calendar Booking)
    let finalResponse = result.response;
    let finalAction = result.nextAction;

    if (result.needsFunctionExecution && result.functionCall?.name === 'book_calendar_event') {
      console.log('📅 AI requests calendar booking:', result.functionCall.args);
      
      try {
        const { createCalendarEvent } = await import('@/lib/calendar-client');
        const { generateResponseAfterFunction } = await import('@/lib/ai-qualification');
        
        const args = result.functionCall.args;
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
        
        const postFunctionResult = await generateResponseAfterFunction({
          tenant: tenant,
          conversationHistory: conversationHistory,
          functionResult: {
            success: true,
            calendar_link: event.htmlLink,
            event_time: startTime.toLocaleString('en-US', { 
              weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' 
            })
          }
        });
        
        finalResponse = postFunctionResult.response;
        console.log('✅ Calendar booking successful');
      } catch (err: any) {
        console.error('❌ Calendar booking failed:', err);
        const { generateResponseAfterFunction } = await import('@/lib/ai-qualification');
        const errorResult = await generateResponseAfterFunction({
          tenant: tenant,
          conversationHistory: conversationHistory,
          functionResult: {
            success: false,
            error: err.message || 'Failed to access calendar'
          }
        });
        finalResponse = errorResult.response;
        finalAction = 'needs_manual_attention';
      }
    }

    // Return AI response + metadata
    return NextResponse.json({
      success: true,
      aiResponse: finalResponse,
      extractedData: result.extractedData,
      leadScore: result.extractedData ? calculateLeadScore({ ...tenant, ...result.extractedData }) : tenant.lead_score,
      leadQuality: result.extractedData ? getLeadQuality(calculateLeadScore({ ...tenant, ...result.extractedData })) : tenant.lead_quality,
      matchedProperties: matchedProperties.slice(0, 3), // Top 3 matches
      nextAction: finalAction,
    });
    
  } catch (error) {
    console.error('❌ Error in auto-reply endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
