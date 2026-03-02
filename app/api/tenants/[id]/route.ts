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

// GET - Fetch a single tenant by ID
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
      .from('tenants')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    
    return NextResponse.json({ tenant: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PATCH - Update tenant fields (e.g. do_not_contact opt-out)
export async function PATCH(
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
    const allowedFields = ['do_not_contact', 'do_not_contact_at', 'do_not_contact_reason', 'resubscribed_at'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

// DELETE - Remove a tenant and all their messages
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.id;
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode'); // ?mode=anonymize for GDPR Right-to-be-Forgotten

    if (mode === 'anonymize') {
      // GDPR / CCPA Right to be Forgotten — anonymize PII rather than hard delete
      // This preserves audit log integrity while removing personal data
      await supabase.from('tenants').update({
        name: 'Anonymized User',
        email: `anonymized-${tenantId}@deleted.local`,
        phone: null,
        source: 'anonymized',
        do_not_contact: true,
        do_not_contact_at: new Date().toISOString(),
        do_not_contact_reason: 'gdpr_erasure',
      }).eq('id', tenantId).eq('user_id', user.id);

      // Anonymize message content (preserve metadata for audit)
      await supabase.from('messages')
        .update({ content: '[Deleted per Right to be Forgotten request]' })
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id);

      // Log the erasure
      await supabase.from('ai_audit_log').insert({
        tenant_id: tenantId,
        action: 'gdpr_erasure',
        thought_process: `PII anonymized per Right-to-be-Forgotten request by user ${user.id}`,
        ai_model: 'n/a',
        response_ms: 0,
      });

      return NextResponse.json({ success: true, mode: 'anonymized' });
    }

    // Standard hard delete
    await supabase
      .from('messages')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id);

    await supabase
      .from('appointments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id);

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}

