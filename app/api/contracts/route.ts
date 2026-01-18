import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all contracts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'Active', 'Pending', 'Completed', 'Draft'
    
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status && status !== 'all') {
      const statusMap: { [key: string]: string } = {
        'active': 'Active',
        'pending': 'Pending',
        'completed': 'Completed',
        'draft': 'Draft'
      };
      const mappedStatus = statusMap[status.toLowerCase()] || status;
      query = query.eq('status', mappedStatus);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ contracts: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST - Create a new contract
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('contracts')
      .insert([
        {
          user_id: body.user_id, // Will use from auth later
          name: body.name,
          property_id: body.property_id,
          property_address: body.property_address,
          tenant_id: body.tenant_id,
          tenant_name: body.tenant_name,
          status: body.status || 'Draft',
          start_date: body.start_date,
          end_date: body.end_date,
          content: body.content,
          is_primary: body.is_primary || false,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contract:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ contract: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
