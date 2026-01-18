import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all tenants
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'Current', 'Pending', 'Late Payment', 'Archived'
    
    let query = supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status && status !== 'all') {
      const statusMap: { [key: string]: string } = {
        'current': 'Current',
        'pending': 'Pending',
        'late': 'Late Payment',
        'archived': 'Archived'
      };
      const mappedStatus = statusMap[status.toLowerCase()] || status;
      query = query.eq('status', mappedStatus);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tenants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ tenants: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST - Create a new tenant
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('tenants')
      .insert([
        {
          user_id: body.user_id, // Will use from auth later
          name: body.name,
          email: body.email,
          phone: body.phone,
          avatar: body.avatar,
          property_id: body.property_id,
          property_address: body.property_address,
          status: body.status || 'Pending',
          lease_start: body.lease_start,
          lease_end: body.lease_end,
          rent_amount: body.rent_amount,
          payment_status: body.payment_status,
          move_in_date: body.move_in_date,
          emergency_contact: body.emergency_contact,
          notes: body.notes,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tenant:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ tenant: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
