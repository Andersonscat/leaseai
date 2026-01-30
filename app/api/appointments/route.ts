
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

  // Get query params
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let query = supabase
    .from('appointments')
    .select(`
      *,
      tenants (
        id,
        name,
        email,
        phone,
        notes
      ),
      properties (
        id,
        address,
        images,
        price,
        beds,
        baths
      )
    `)
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate upcoming showings (future events)
  const now = new Date();
  const upcomingAppointments = appointments?.filter(apt => new Date(apt.start_time) > now) || [];

  return NextResponse.json({ 
    appointments,
    upcoming: upcomingAppointments 
  });
}
