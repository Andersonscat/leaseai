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
    
    // Parse numeric fields correctly
    const price_monthly = body.price ? parseInt(body.price.toString().replace(/[^0-9]/g, ''), 10) : null;
    const sqft = body.sqft ? parseInt(body.sqft.toString().replace(/[^0-9]/g, ''), 10) : null;
    const walk_score = body.walk_score ? parseInt(body.walk_score.toString().replace(/[^0-9]/g, ''), 10) : null;
    const transit_score = body.transit_score ? parseInt(body.transit_score.toString().replace(/[^0-9]/g, ''), 10) : null;
    
    const lease_term_match = body.lease_term ? body.lease_term.toString().match(/\d+/) : null;
    const lease_term_min = lease_term_match ? parseInt(lease_term_match[0], 10) : null;
    
    const application_fee = body.application_fee ? parseInt(body.application_fee.toString().replace(/[^0-9]/g, ''), 10) : null;
    const security_deposit = body.security_deposit ? parseInt(body.security_deposit.toString().replace(/[^0-9]/g, ''), 10) : null;

    // Map Parking
    const parking_available = body.parking !== 'No parking';
    let parking_type = body.parking !== 'No parking' ? body.parking : 'none';
    if (parking_type.length > 50) {
      parking_type = parking_type.substring(0, 50);
    }

    // Map Pet Policy (Varchar 50)
    const petsText = (body.pets || '').toLowerCase();
    let pet_policy = 'no_pets';
    if (petsText.includes('cats only')) pet_policy = 'cats_only';
    else if (petsText.includes('dogs only') || petsText.includes('small')) pet_policy = 'small_dogs';
    else if (petsText.includes('allow') || petsText.includes('yes')) pet_policy = 'allowed';
    
    // Calculate furnished & laundry_type from features/amenities
    const allTags = [...(body.amenities || []), ...(body.features || [])].map((t: string) => t.toLowerCase());
    const furnished = allTags.some(t => t.includes('furnished'));
    
    let laundry_type = 'none';
    if (allTags.some(t => t.includes('in-unit washer') || t.includes('in-unit dryer') || t.includes('in-unit laundry'))) {
      laundry_type = 'in_unit';
    } else if (allTags.some(t => t.includes('shared laundry') || t.includes('laundry room'))) {
      laundry_type = 'shared';
    } else if (allTags.some(t => t.includes('hookup') || t.includes('connections'))) {
      laundry_type = 'hookups';
    }
    
    // Safety truncations for VARCHAR(50) columns
    if (parking_type.length > 50) parking_type = parking_type.substring(0, 50);
    if (pet_policy.length > 50) pet_policy = pet_policy.substring(0, 50);
    if (laundry_type.length > 50) laundry_type = laundry_type.substring(0, 50);
    
    const { data, error} = await supabase
      .from('properties')
      .insert([
        {
          user_id: user.id,
          type: body.type,
          address: body.address,
          city: body.city,
          state: body.state,
          zip_code: body.zip_code,
          price_monthly,
          beds: body.beds,
          baths: body.baths,
          sqft,
          pet_policy,
          parking_type,
          parking_available,
          status: body.status || 'available',
          description: body.description,
          amenities: body.amenities,
          features: body.features,
          rules: body.rules,
          images: body.images,
          walk_score,
          transit_score,
          lease_term_min,
          available_from: body.available_from || null,
          application_fee,
          security_deposit,
          furnished,
          laundry_type,
          ai_assisted: body.ai_assisted !== undefined ? body.ai_assisted : true,
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
