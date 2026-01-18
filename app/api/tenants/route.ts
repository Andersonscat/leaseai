import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to create authenticated Supabase client
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

// GET - Fetch all tenants for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ tenants: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST - Create a new tenant
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('tenants')
      .insert([
        {
          user_id: user.id, // Use authenticated user's ID
          name: body.name,
          email: body.email,
          phone: body.phone,
          property_id: body.property_id,
          move_in_date: body.move_in_date,
          lease_end_date: body.lease_end_date,
          rent_amount: body.rent_amount,
          status: body.status || 'Current',
          notes: body.notes,
        },
      ])
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ tenant: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
