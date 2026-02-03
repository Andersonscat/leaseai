import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndIso = todayEnd.toISOString();

    // 1. Fetch Today's Showings
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        id,
        title,
        start_time,
        status,
        tenants (id, name),
        properties (id, address)
      `)
      .eq('user_id', user.id)
      .gte('start_time', now)
      .lte('start_time', todayEndIso)
      .order('start_time', { ascending: true });

    // 2. Fetch New Leads (Pending tenants from last 48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: newLeads } = await supabase
      .from('tenants')
      .select('id, name, email, created_at, status, lead_score, lead_quality')
      .eq('user_id', user.id)
      .eq('status', 'Pending')
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Map to Action Cards
    const actions: any[] = [];

    // Add Showings
    appointments?.forEach(apt => {
      const tenant = Array.isArray(apt.tenants) ? apt.tenants[0] : apt.tenants;
      const property = Array.isArray(apt.properties) ? apt.properties[0] : apt.properties;
      
      actions.push({
        id: `showing-${apt.id}`,
        type: 'showing',
        priority: 'high',
        title: new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subtitle: property?.address || 'Property Viewing',
        meta: tenant?.name || 'Guest',
        status: apt.status,
        buttonText: 'Remind Client',
        link: `/dashboard?tab=calendar&event=${apt.id}`
      });
    });

    // Add New Leads
    newLeads?.forEach(lead => {
      actions.push({
        id: `lead-${lead.id}`,
        type: 'new_lead',
        priority: lead.lead_score && lead.lead_score >= 7 ? 'high' : 'medium',
        title: 'New Lead',
        subtitle: lead.name,
        meta: lead.lead_quality ? `${lead.lead_quality} Match` : 'Email Inquiry',
        status: 'pending',
        buttonText: 'View & Reply',
        link: `/dashboard?tab=inbox&tenant=${lead.id}`
      });
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error('Error fetching inbox actions:', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}
