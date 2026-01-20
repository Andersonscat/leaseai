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

/**
 * GET - Fetch all messages in a conversation (thread)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantId = params.tenantId;
    
    // Get all messages for this tenant
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        tenant:tenants(name, email, phone, avatar),
        property:properties(address, price)
      `)
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching conversation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Mark all tenant messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('sender_type', 'tenant')
      .eq('is_read', false);
    
    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET /api/conversations/[tenantId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send a message in this conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createAuthenticatedClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const tenantId = params.tenantId;
    
    // Get existing messages to determine property and source
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('property_id, source')
      .eq('tenant_id', tenantId)
      .limit(1);
    
    const propertyId = existingMessages?.[0]?.property_id || null;
    const source = existingMessages?.[0]?.source || 'manual';
    
    // Create reply message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          user_id: user.id,
          property_id: propertyId,
          tenant_id: tenantId,
          sender_type: 'landlord',
          sender_name: 'You',
          message_text: body.message,
          source,
          is_read: true,
        },
      ])
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/conversations/[tenantId]:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
