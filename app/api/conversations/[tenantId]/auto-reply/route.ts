import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  calculateLeadScore,
  getLeadQuality,
  matchProperties,
  analyzeConversation,
  generateFinalResponse,
  verifyResponseHallucinations,
  extractLeadData
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

    const realtorName = user.user_metadata?.full_name || userData?.email?.split('@')[0] || 'Agent';

    // 5. NEW: Modular AI Pipeline (Extraction 2.0)
    // 5.1 Extract Data & Detect Conflicts
    const questionnaire = await extractLeadData(conversationHistory, tenant);
    
    if (questionnaire.conflicts && questionnaire.conflicts.length > 0) {
      console.warn('⚡ AI Conflict Detected:', questionnaire.conflicts);
    }

    // 5.2 Map questionnaire to TenantData updates
    const extractionUpdates: any = {};
    if (questionnaire.fullName?.value) extractionUpdates.name = questionnaire.fullName.value;
    if (questionnaire.budgetMax?.value) extractionUpdates.budget_max = questionnaire.budgetMax.value;
    if (questionnaire.moveInDate?.value) extractionUpdates.move_in_date = questionnaire.moveInDate.value;
    if (questionnaire.bedrooms?.value) extractionUpdates.bedrooms = questionnaire.bedrooms.value;
    if (questionnaire.hasPets?.value !== undefined) extractionUpdates.has_pets = questionnaire.hasPets.value;
    if (questionnaire.petsDetails?.value) extractionUpdates.pet_details = questionnaire.petsDetails.value;
    if (questionnaire.occupantsCount?.value) extractionUpdates.occupants = questionnaire.occupantsCount.value;
    if (questionnaire.parkingNeeded?.value !== undefined) extractionUpdates.parking_needed = questionnaire.parkingNeeded.value;

    // 5.3 Update Tenant in DB with confidence-aware data
    if (Object.keys(extractionUpdates).length > 0) {
      console.log('📝 Updating tenant data from extraction:', extractionUpdates);
      
      const newScore = calculateLeadScore({ ...tenant, ...extractionUpdates });
      const newQuality = getLeadQuality(newScore);
      extractionUpdates.lead_score = newScore;
      extractionUpdates.lead_quality = newQuality;

      await supabase.from('tenants').update(extractionUpdates).eq('id', tenantId);
      
      // Update local tenant object for subsequent steps
      Object.assign(tenant, extractionUpdates);
    }

    // 6. Planning & Execution (AI Brain Phase 2)
    // 6.1 Analyze & Decide Action
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

    // 6.2 Execute Actions (Calendar, etc.)
    let executionResult: { success: boolean; data?: any; error?: string } = { success: true };
    
    if (analysis.action === 'book_calendar' && analysis.action_params) {
      // ... (Calendar execution logic remains same)
      console.log('📅 Action: Booking Calendar...');
      console.log('📅 Action Params:', JSON.stringify(analysis.action_params, null, 2));
      try {
         const { createCalendarEvent } = await import('@/lib/calendar-client');
         const args = analysis.action_params;
         
         // Strip any timezone suffix the AI might add — we want a naive datetime
         // since Google Calendar will use the timeZone field (America/Los_Angeles)
         const startTimeStr = args.start_time
           .replace(/Z$/i, '')
           .replace(/[+-]\d{2}:\d{2}$/, '')
           .replace(/\.\d{3}$/, '');
         
         // Validate the datetime format
         if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(startTimeStr)) {
           throw new Error(`Invalid start_time format from AI: "${args.start_time}"`);
         }
         
         // Compute end time without timezone interference:
         // Parse as UTC (append Z) so the math is clean, then strip it back
         const duration = args.duration_minutes || 30;
         const startAsUtc = new Date(startTimeStr + 'Z');
         const endAsUtc = new Date(startAsUtc.getTime() + duration * 60000);
         const endTimeStr = endAsUtc.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
         
         console.log('📅 Passing to Calendar (Pacific):', { start: startTimeStr, end: endTimeStr });
         
         const event = await createCalendarEvent(
            startTimeStr,
            endTimeStr,
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


    // 7. Find matches
    let matchedProperties: any[] = [];
    if (tenant.lead_quality === 'hot' || tenant.lead_quality === 'warm') {
      matchedProperties = matchProperties(tenant as any, properties || []);
    }

    // 8. Generate Final Response with Verification Loop
    let finalResponse = '';
    let hallucinationsFound = false;
    let hallucinatedAddresses: string[] = [];
    let retryCount = 0;
    const MAX_RETRIES = 2;

    while (retryCount <= MAX_RETRIES) {
      finalResponse = await generateFinalResponse(
        {
          tenant: { name: tenant.name, email: tenant.email },
          properties: properties || [],
          conversationHistory,
          realtorName
        },
        analysis,
        executionResult
      );

      // Verify for hallucinations
      const verification = await verifyResponseHallucinations(finalResponse, properties || []);
      
      if (!verification.hasHallucinations) {
        break; // Success!
      }

      // If we found hallucinations, log and retry
      console.warn(`⚠️ Hallucination detected (Attempt ${retryCount + 1}):`, verification.hallucinatedAddresses);
      hallucinationsFound = true;
      hallucinatedAddresses = Array.from(new Set([...hallucinatedAddresses, ...verification.hallucinatedAddresses]));
      
      // Update analysis context for next iteration to be more strict
      analysis.thought_process += `\n[SYSTEM WARNING]: You previously mentioned the following non-existent addresses which caused a hallucination error: ${verification.hallucinatedAddresses.join(', ')}. DO NOT mention them again. ONLY use addresses from the database.`;
      
      retryCount++;
    }

    return NextResponse.json({
      success: true,
      aiResponse: finalResponse,
      extractedData: analysis.extractedData,
      thoughts: analysis.thoughts,
      leadScore: tenant.lead_score, 
      leadQuality: tenant.lead_quality,
      matchedProperties: matchedProperties.slice(0, 5),
      nextAction: analysis.action,
      listingAddresses: analysis.listing_addresses,
      hallucinationsDetected: hallucinationsFound,
      hallucinatedAddresses: hallucinatedAddresses
    });
    
  } catch (error) {
    console.error('❌ Error in auto-reply endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
