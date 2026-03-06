import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  calculateLeadScore,
  getLeadQuality,
  analyzeConversation 
} from '@/lib/ai-qualification';

function createAuthenticatedClient() {
  const cookieStore = cookies();
  
  return createServerClient(
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
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId;
  console.log(`\n\n🚀 [AI ANALYZE] Starting request for tenant: ${tenantId}`);
  
  try {
    console.log('📦 [AI ANALYZE] Getting cookies...');
    const cookieStore = cookies();
    console.log('🔑 [AI ANALYZE] Initializing Supabase client...');
    const supabase = createAuthenticatedClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ AI Analysis: Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      console.error('❌ AI Analysis: Tenant not found', tenantError);
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 2. Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('message_text, sender_type')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(30); // Reduced from 50 to 30 for safety

    if (messagesError) {
      console.error('❌ AI Analysis: Error fetching messages', messagesError);
    }

    const conversationHistory =
      messages?.map((msg) => ({
        role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
        content: msg.message_text,
      })) || [];

    // 3. Get realtor's properties for context
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['Active', 'Available']);

    // 4. Run AI Analysis
    const realtorName    = user.user_metadata?.ai_signature_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent';
    const realtorPhone   = user.user_metadata?.ai_phone || user.user_metadata?.phone || user.phone;
    const realtorCompany = user.user_metadata?.company || user.user_metadata?.brokerage_name || '';
    const timezone       = user.user_metadata?.timezone || 'America/Los_Angeles';
    const viewingHoursStart = user.user_metadata?.viewing_hours_start || '10:00';
    const viewingHoursEnd   = user.user_metadata?.viewing_hours_end   || '20:00';
    console.log('🧠 AI Brain: Running analyzeConversation...');
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
      realtorPhone,
      realtorCompany,
      timezone,
      viewingHoursStart,
      viewingHoursEnd,
    });

    // 5. Build update object — map the full AI extractedData to existing DB columns
    const updateData: any = {};

    // AI summary — stored in notes until ai_summary column is added
    let aiSummaryText: string | undefined;
    if (analysis.summary) {
      aiSummaryText = typeof analysis.summary === 'string'
        ? analysis.summary
        : [analysis.summary.client, analysis.summary.interests, analysis.summary.concerns, analysis.summary.next_step]
            .filter(Boolean).join(' | ');
      updateData.notes = aiSummaryText;
    }

    if (analysis.extractedData) {
      const ed = analysis.extractedData;

      // --- Budget ---
      const budgetVal = ed.budget?.budget_usd ?? ed.budget?.max_monthly_rent ?? ed.budget_max;
      if (budgetVal) updateData.budget_max = budgetVal;

      // --- Timeline ---
      const moveIn = ed.timeline?.move_in_date ?? ed.move_in_date;
      if (moveIn) updateData.move_in_date = moveIn;

      const leaseTerm = ed.timeline?.lease_term_ideal_months;
      if (leaseTerm) updateData.lease_duration = `${leaseTerm}_months`;

      // --- Housing ---
      const bedrooms = ed.housing?.bedrooms_min;
      if (bedrooms != null) updateData.bedrooms = bedrooms;

      const bathrooms = ed.housing?.bathrooms_min;
      if (bathrooms != null) updateData.bathrooms = bathrooms;

      const furnished = ed.housing?.furnished;
      if (furnished) updateData.furnishing = furnished;

      const propTypes = ed.housing?.property_types;
      if (Array.isArray(propTypes) && propTypes.length > 0) {
        updateData.property_type = propTypes[0];
      }

      // --- Occupants ---
      const occupants = ed.occupants?.total_count;
      if (occupants != null) updateData.num_occupants = occupants;

      // --- Pets ---
      if (ed.pets?.has_pets !== undefined) updateData.has_pets = ed.pets.has_pets;
      if (ed.pets && Object.keys(ed.pets).length > 0) {
        updateData.pet_details = ed.pets;
      }
      // Legacy flat fields
      if (ed.has_pets !== undefined && updateData.has_pets === undefined) updateData.has_pets = ed.has_pets;
      if (ed.pet_details && !updateData.pet_details) updateData.pet_details = ed.pet_details;

      // --- Amenities / Must-haves / Deal-breakers ---
      if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.length > 0) {
        updateData.must_haves = ed.amenities.desired_features;
      }
      if (Array.isArray(ed.amenities?.deal_breakers) && ed.amenities.deal_breakers.length > 0) {
        updateData.deal_breakers = ed.amenities.deal_breakers;
      }
      if (ed.amenities?.parking?.required === 'required') {
        updateData.needs_parking = true;
      }

      // --- Location ---
      if (Array.isArray(ed.location?.neighborhoods_must) && ed.location.neighborhoods_must.length > 0) {
        updateData.preferred_neighborhoods = ed.location.neighborhoods_must;
      }

      // Priority stored in lead_quality (lead_priority column doesn't exist yet)
      if (analysis.priority) {
        updateData.lead_quality = analysis.priority;
      }
    }

    // Recalculate scoring - trigger in DB does this too, but we do it for immediate UI update
    const updatedTenant = { ...tenant, ...(analysis.extractedData || {}) };
    const newScore = calculateLeadScore(updatedTenant);
    updateData.lead_score = newScore;
    updateData.lead_quality = getLeadQuality(newScore);

    console.log('💾 AI Analysis: Updating database with', updateData);

    // 6. Update DB — try full update first, fall back if extended columns don't exist yet
    let { error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId);

    if (updateError?.code === '42703') {
      console.log('⚠️ Extended columns not found, falling back to basic fields');
      const basicUpdate: any = {};
      if (updateData.move_in_date) basicUpdate.move_in_date = updateData.move_in_date;
      if (updateData.notes) basicUpdate.notes = updateData.notes;

      const fallback = await supabase
        .from('tenants')
        .update(basicUpdate)
        .eq('id', tenantId);
      updateError = fallback.error;
    }

    if (updateError) {
      console.error('❌ AI Analysis: DB update failed', updateError);
      return NextResponse.json({ 
        error: 'Database update failed', 
        details: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
      updatedData: updateData
    });
    
  } catch (error: any) {
    console.error('❌ CRITICAL Error in analyze endpoint:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
