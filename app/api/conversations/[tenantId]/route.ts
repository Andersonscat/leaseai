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
    
    // Guard against invalid tenantId
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      return NextResponse.json({ error: 'Invalid tenant ID', messages: [] }, { status: 400 });
    }
    
    // Get all messages for this tenant
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        tenant:tenants(name, email, phone, avatar, auto_reply_enabled),
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
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('sender_type', 'tenant')
      .eq('is_read', false);
      
    if (updateError) {
      console.error('Failed to update is_read status:', updateError);
    }
    
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
    
    // Allow explicitly setting sender_type (e.g. for ai_reasoning)
    const senderType = body.sender_type || 'landlord';
    const senderName = senderType === 'ai_reasoning' ? 'AI Assistant' : 'You';
    
    // Get existing messages to determine property and source
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('property_id, source')
      .eq('tenant_id', tenantId)
      .limit(1);
    
    const propertyId = existingMessages?.[0]?.property_id || null;
    const source = existingMessages?.[0]?.source || 'manual';
    
    // Create message with optional thoughts
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          user_id: user.id,
          property_id: propertyId,
          tenant_id: tenantId,
          sender_type: senderType,
          sender_name: senderName,
          message_text: body.message,
          thoughts: body.thoughts || null,
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

/**
 * PATCH - Update conversation settings (e.g. toggle AI assistant)
 */
export async function PATCH(
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
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        auto_reply_enabled: body.auto_reply_enabled
      })
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error in PATCH /api/conversations/[tenantId]:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation settings' },
      { status: 500 }
    );
  }
}
