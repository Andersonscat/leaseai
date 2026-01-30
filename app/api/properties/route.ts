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

// GET - Fetch all properties for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'rent' or 'sale'
    
    let query = supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id) // Only show properties owned by current user
      .is('deleted_at', null) // Only show non-deleted properties
      .order('created_at', { ascending: false });
    
    // Filter by type if provided
    if (type && (type === 'rent' || type === 'sale')) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ properties: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// POST - Create a new property
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    const { data, error} = await supabase
      .from('properties')
      .insert([
        {
          user_id: user.id, // Use authenticated user's ID
          type: body.type,
          address: body.address,
          city: body.city,
          state: body.state,
          zip_code: body.zip_code,
          price: body.price,
          beds: body.beds,
          baths: body.baths,
          sqft: body.sqft,
          pets: body.pets,
          parking: body.parking,
          parking_available: body.parking_available || false,
          status: body.status || 'Available',
          description: body.description,
          amenities: body.amenities,
          features: body.features,
          rules: body.rules,
          images: body.images,
          walk_score: body.walk_score,
          transit_score: body.transit_score,
          lease_term: body.lease_term,
          available_from: body.available_from || null,
          pet_policy: body.pet_policy || 'allowed',
          parking_type: body.parking_type || 'none',
          parking_fee: body.parking_fee ? parseFloat(body.parking_fee) : null,
          application_fee: body.application_fee ? parseFloat(body.application_fee) : null,
          security_deposit: body.security_deposit ? parseFloat(body.security_deposit) : null,
          utilities_fee: body.utilities_fee ? parseFloat(body.utilities_fee) : null,
          utilities_included: body.utilities_included || [],
        },
      ])
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ property: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
