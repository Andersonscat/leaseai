import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all properties for the current user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'rent' or 'sale'
    
    let query = supabase
      .from('properties')
      .select('*')
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
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // TODO: Get user_id from auth session
    // For now, you'll need to add user_id from Clerk or Supabase Auth
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          user_id: body.user_id, // Replace with actual auth user ID
          type: body.type,
          address: body.address,
          price: body.price,
          beds: body.beds,
          baths: body.baths,
          sqft: body.sqft,
          pets: body.pets,
          status: body.status || 'Available',
          description: body.description,
          amenities: body.amenities,
          features: body.features,
          rules: body.rules,
          images: body.images,
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
