import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  calculateLeadScore,
  getLeadQuality,
  cleanMessageForHistory,
  extractKnownFields,
  runAgentPipeline,
} from '@/lib/ai-qualification';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('message_text, sender_type')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(30);

    const conversationHistory =
      messages?.map((msg) => ({
        role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
        content: cleanMessageForHistory(msg.message_text),
      })) || [];

    const { data: properties } = await supabase
      .from('properties')
      .select('*, building:buildings(id, name, amenities, rules, pet_policy, parking_type, walk_score, transit_score)')
      .eq('user_id', user.id)
      .in('status', ['Active', 'Available']);

    const realtorName    = user.user_metadata?.ai_signature_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent';
    const realtorPhone   = user.user_metadata?.ai_phone || user.user_metadata?.phone || user.phone;
    const realtorCompany = user.user_metadata?.company || user.user_metadata?.brokerage_name || '';
    const timezone       = user.user_metadata?.timezone || 'America/Los_Angeles';
    const viewingHoursStart = user.user_metadata?.viewing_hours_start || '10:00';
    const viewingHoursEnd   = user.user_metadata?.viewing_hours_end   || '20:00';

    const agentResult = await runAgentPipeline({
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
      knownFields: extractKnownFields(tenant),
    });

    const analysis = {
      thought_process: agentResult.thoughtProcess,
      intent: agentResult.action === 'book_calendar' ? 'booking_confirmed' : 'general',
      action: agentResult.action,
      extractedData: agentResult.extractedData || undefined,
      priority: 'warm',
    };

    const updateData: any = {};
    if (agentResult.extractedData) {
      const ed = agentResult.extractedData;

      const budgetVal = ed.budget?.budget_usd ?? ed.budget?.max_monthly_rent ?? ed.budget_max;
      if (budgetVal) updateData.budget_max = budgetVal;

      const moveIn = ed.timeline?.move_in_date ?? ed.move_in_date;
      if (moveIn) updateData.move_in_date = moveIn;

      if (ed.timeline?.lease_term_ideal_months) updateData.lease_duration = `${ed.timeline.lease_term_ideal_months}_months`;
      if (ed.housing?.bedrooms_min != null) updateData.bedrooms = ed.housing.bedrooms_min;
      if (ed.housing?.bathrooms_min != null) updateData.bathrooms = ed.housing.bathrooms_min;
      if (ed.housing?.furnished) updateData.furnishing = ed.housing.furnished;
      if (Array.isArray(ed.housing?.property_types) && ed.housing.property_types.length > 0) updateData.property_type = ed.housing.property_types[0];
      if (ed.occupants?.total_count != null) updateData.num_occupants = ed.occupants.total_count;
      if (ed.pets?.has_pets !== undefined) updateData.has_pets = ed.pets.has_pets;
      if (ed.pets && Object.keys(ed.pets).length > 0) updateData.pet_details = ed.pets;
      if (ed.has_pets !== undefined && updateData.has_pets === undefined) updateData.has_pets = ed.has_pets;
      if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.length > 0) updateData.must_haves = ed.amenities.desired_features;
      if (Array.isArray(ed.amenities?.deal_breakers) && ed.amenities.deal_breakers.length > 0) updateData.deal_breakers = ed.amenities.deal_breakers;
      if (ed.amenities?.parking?.required === 'required') updateData.needs_parking = true;
      if (Array.isArray(ed.location?.neighborhoods_must) && ed.location.neighborhoods_must.length > 0) updateData.preferred_neighborhoods = ed.location.neighborhoods_must;
      if (ed.location?.city?.trim()) updateData.preferred_city = ed.location.city.trim();
      if (ed.location?.state?.trim()) updateData.preferred_state = ed.location.state.trim();
    }

    const updatedTenant = { ...tenant, ...updateData };
    const newScore = calculateLeadScore(updatedTenant);
    updateData.lead_score = newScore;
    updateData.lead_quality = getLeadQuality(newScore);

    let { error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId);

    if (updateError?.code === '42703') {
      const basicUpdate: any = {};
      if (updateData.move_in_date) basicUpdate.move_in_date = updateData.move_in_date;
      if (updateData.notes) basicUpdate.notes = updateData.notes;
      const fallback = await supabase.from('tenants').update(basicUpdate).eq('id', tenantId);
      updateError = fallback.error;
    }

    if (updateError) {
      return NextResponse.json({
        error: 'Database update failed',
        details: updateError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
      updatedData: updateData,
    });

  } catch (error: any) {
    console.error('❌ Error in analyze endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
