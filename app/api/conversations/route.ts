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
 * GET - Fetch all conversations (grouped by tenant)
 * Returns: List of conversations with last message and unread count
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    
    // Get all messages grouped by tenant
    let query = supabase
      .from('messages')
      .select(`
        id,
        tenant_id,
        sender_type,
        sender_name,
        sender_avatar,
        message_text,
        source,
        is_read,
        created_at,
        tenant:tenants(
          id,
          name,
          email,
          phone,
          avatar
        ),
        property:properties(
          id,
          address,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    // Filter by source if provided
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }
    
    const { data: messages, error } = await query;
    
    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Group messages by tenant_id to create conversations
    const conversationsMap = new Map();
    
    for (const message of messages || []) {
      const tenantId = message.tenant_id;
      
      if (!conversationsMap.has(tenantId)) {
        // First message from this tenant - create conversation
        conversationsMap.set(tenantId, {
          tenant_id: tenantId,
          tenant: message.tenant,
          property: message.property,
          last_message: message.message_text,
          last_message_time: message.created_at,
          last_sender_type: message.sender_type,
          source: message.source,
          unread_count: message.is_read ? 0 : 1,
          total_messages: 1,
          messages: [message], // Store all messages for this conversation
        });
      } else {
        // Add to existing conversation
        const conversation = conversationsMap.get(tenantId);
        conversation.total_messages++;
        if (!message.is_read && message.sender_type === 'tenant') {
          conversation.unread_count++;
        }
        conversation.messages.push(message);
      }
    }
    
    // Convert map to array and sort by last message time
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
