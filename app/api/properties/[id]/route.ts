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

// GET - Fetch a single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id) // Only show properties owned by current user
      .is('deleted_at', null) // Only show non-deleted properties
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ property: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// PUT - Update a property
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // First check if property exists and belongs to user
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (property.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this property' }, { status: 403 });
    }
    
    // Get the updated data from request body
    const body = await request.json();
    
    // Parse numeric fields correctly
    const price_monthly = body.price ? parseInt(body.price.toString().replace(/[^0-9]/g, ''), 10) : null;
    const sqft = body.sqft ? parseInt(body.sqft.toString().replace(/[^0-9]/g, ''), 10) : null;
    
    // Update the property
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        price_monthly,
        beds: body.beds,
        baths: body.baths,
        sqft,
        pets: body.pets,
        parking: body.parking,
        parking_available: body.parking_available,
        description: body.description,
        status: body.status,
        images: body.images,
        amenities: body.amenities,
        features: body.features,
        rules: body.rules,
        walk_score: body.walk_score,
        transit_score: body.transit_score,
        lease_term: body.lease_term,
        // New Zillow-aligned fields
        available_from: body.available_from,
        pet_policy: body.pet_policy,
        parking_type: body.parking_type,
        parking_fee: body.parking_fee,
        application_fee: body.application_fee,
        security_deposit: body.security_deposit,
        utilities_included: body.utilities_included,
        utilities_fee: body.utilities_fee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      property: updatedProperty,
      message: 'Property updated successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a property (mark as deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // First check if property exists and belongs to user
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (property.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this property' }, { status: 403 });
    }
    
    // Soft delete by setting deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('properties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Property deleted successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
