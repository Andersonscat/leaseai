import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { geocodeAddress } from '@/lib/geocoding';

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

export async function GET() {
  try {
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const buildingIds = (buildings || []).map(b => b.id);
    let unitCounts: Record<string, number> = {};

    if (buildingIds.length > 0) {
      const { data: props } = await supabase
        .from('properties')
        .select('building_id')
        .in('building_id', buildingIds)
        .is('deleted_at', null);

      if (props) {
        for (const p of props) {
          if (p.building_id) {
            unitCounts[p.building_id] = (unitCounts[p.building_id] || 0) + 1;
          }
        }
      }
    }

    const result = (buildings || []).map(b => ({
      ...b,
      unit_count: unitCounts[b.id] || 0,
    }));

    return NextResponse.json({ buildings: result });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
  }
}

interface UnitInput {
  unit_number: string;
  beds: number;
  baths: number;
  sqft?: number | null;
  price: number;
  available_from?: string | null;
  floor?: number | null;
  status?: string;
  furnished?: boolean;
  lease_term?: string;
  description?: string;
  images?: string[];
  amenities?: string[];
  move_in_special?: string;
}

function parseAvailableFrom(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === 'now' || s === 'immediately' || s === 'available') return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s.includes(',') ? s : `${s}, ${new Date().getFullYear()}`);
  if (!isNaN(parsed.getTime())) {
    if (parsed < new Date()) parsed.setFullYear(parsed.getFullYear() + 1);
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * POST /api/buildings
 * Creates a building and its units in one request.
 * Body: { building: {...}, units: UnitInput[] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { building: bldg, units } = body as { building: any; units: UnitInput[] };

    if (!bldg?.address) {
      return NextResponse.json({ error: 'Building address is required' }, { status: 400 });
    }
    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: 'At least one unit is required' }, { status: 400 });
    }

    const petsText = (bldg.pet_policy || bldg.pets || '').toLowerCase();
    let pet_policy = 'no_pets';
    if (petsText.includes('cats only')) pet_policy = 'cats_only';
    else if (petsText.includes('dogs only') || petsText.includes('small')) pet_policy = 'small_dogs';
    else if (petsText.includes('allow') || petsText.includes('yes')) pet_policy = 'allowed';

    let parking_type = bldg.parking_type || bldg.parking || 'none';
    if (parking_type === 'No parking') parking_type = 'none';
    if (parking_type.length > 50) parking_type = parking_type.substring(0, 50);

    // #region agent log
    fetch('http://127.0.0.1:7488/ingest/5f3b3917-fb15-4524-89f0-83eb3c082bc9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'513288'},body:JSON.stringify({sessionId:'513288',location:'buildings/route.ts:119',message:'building insert payload',data:{bldg_type:bldg.type,bldg_name:bldg.name,bldg_building_name:bldg.building_name,bldg_address:bldg.address},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    const VALID_BUILDING_TYPES = ['apartment','condo','townhouse','co_living','mixed'];
    const buildingType = VALID_BUILDING_TYPES.includes(bldg.type) ? bldg.type : 'apartment';

    const { data: building, error: bErr } = await supabase
      .from('buildings')
      .insert({
        user_id: user.id,
        name: bldg.name || bldg.building_name || null,
        address: bldg.address,
        city: bldg.city || null,
        state: bldg.state || null,
        zip_code: bldg.zip_code || null,
        description: bldg.description || null,
        type: buildingType,
        total_units: units.length,
        amenities: bldg.amenities || null,
        community_features: bldg.community_features || null,
        rules: bldg.rules || null,
        pet_policy,
        parking_type,
        laundry_type: bldg.laundry_type || null,
        walk_score: bldg.walk_score ? parseInt(String(bldg.walk_score)) : null,
        transit_score: bldg.transit_score ? parseInt(String(bldg.transit_score)) : null,
        images: bldg.images || null,
        source_url: bldg.source_url || null,
      })
      .select()
      .single();

    if (bErr || !building) {
      return NextResponse.json(
        { error: 'Failed to create building: ' + (bErr?.message || 'unknown') },
        { status: 500 }
      );
    }

    const parseLeaseTermMin = (term?: string): number | null => {
      if (!term) return null;
      const m = term.match(/\d+/);
      return m ? parseInt(m[0], 10) : (term.toLowerCase().includes('month-to-month') ? 1 : null);
    };

    const propertyRows = units.map((u: UnitInput) => ({
      user_id: user.id,
      building_id: building.id,
      unit_number: u.unit_number || null,
      floor: u.floor != null ? u.floor : null,
      type: bldg.type === 'sale' ? 'sale' : 'rent',
      address: `${bldg.address}${u.unit_number ? ' #' + u.unit_number : ''}`,
      city: bldg.city || null,
      state: bldg.state || null,
      zip_code: bldg.zip_code || null,
      price_monthly: u.price || null,
      beds: u.beds ?? 1,
      baths: u.baths ?? 1,
      sqft: u.sqft || null,
      pet_policy,
      parking_type,
      status: u.status || 'available',
      description: u.description || bldg.description || null,
      amenities: Array.isArray(u.amenities) && u.amenities.length > 0 ? u.amenities : null,
      rules: bldg.rules || null,
      images: Array.isArray(u.images) && u.images.length > 0 ? u.images : null,
      available_from: parseAvailableFrom(u.available_from),
      ai_assisted: true,
    }));

    const { data: properties, error: pErr } = await supabase
      .from('properties')
      .insert(propertyRows)
      .select();

    if (pErr) {
      return NextResponse.json(
        { error: 'Building created but units failed: ' + pErr.message },
        { status: 500 }
      );
    }

    // Geocode building address in background
    if (bldg.address) {
      const addrQuery = [bldg.address, bldg.city, bldg.state].filter(Boolean).join(', ');
      geocodeAddress(addrQuery).then(coords => {
        if (!coords) return;
        supabase.from('buildings').update({ lat: coords.lat, lng: coords.lng }).eq('id', building.id).then(() => {});
        const ids = (properties || []).map((p: any) => p.id);
        if (ids.length > 0) {
          supabase.from('properties').update({ lat: coords.lat, lng: coords.lng }).in('id', ids).then(() => {});
        }
      }).catch(() => {});
    }

    return NextResponse.json(
      { building, properties, unit_count: properties?.length || 0 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
  }
}
