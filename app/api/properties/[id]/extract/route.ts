
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { extractPropertyParameters } from '@/lib/property-extractor';

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Property Description
    const { data: property, error: fetchError } = await supabase
       .from('properties')
       .select('id, user_id, description, address, type, price, beds, baths, pets')
       .eq('id', params.id)
       .single();

    if (fetchError || !property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    if (property.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Construct raw text from available fields to give AI context
    // This helps AI merge header data with unstructured text
    const rawText = `
Address: ${property.address}
Type: ${property.type}
Price: ${property.price}
Beds: ${property.beds} Baths: ${property.baths}
Pets: ${property.pets}

Full Description:
${property.description || '(No description provided)'}
    `;

    // Extract
    console.log(`Starting extraction for property ${params.id}...`);
    const parameters = await extractPropertyParameters(rawText, 'text');

    // Save
    const { error: updateError } = await supabase
        .from('properties')
        .update({ property_parameters: parameters, updated_at: new Date().toISOString() })
        .eq('id', params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, parameters });

  } catch (error) {
     console.error('Extraction error:', error);
     return NextResponse.json({ error: 'Extraction failed: ' + (error as any).message }, { status: 500 });
  }
}
