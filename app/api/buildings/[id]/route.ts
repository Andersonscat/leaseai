import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: building, error: bErr } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (bErr || !building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    const { data: units } = await supabase
      .from('properties')
      .select('*')
      .eq('building_id', params.id)
      .is('deleted_at', null)
      .order('unit_number', { ascending: true });

    return NextResponse.json({ building, units: units || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch building' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data: existing } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    const updateFields: Record<string, any> = {};
    const allowed = [
      'name', 'address', 'city', 'state', 'zip_code', 'description', 'type',
      'total_units', 'amenities', 'community_features', 'rules', 'pet_policy',
      'parking_type', 'laundry_type', 'walk_score', 'transit_score', 'images',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) updateFields[key] = body[key];
    }

    const { data: building, error } = await supabase
      .from('buildings')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ building });
  } catch {
    return NextResponse.json({ error: 'Failed to update building' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 });
  }
}
