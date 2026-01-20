import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DELETE conversation and all associated messages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.tenantId;

    // Delete all messages for this tenant
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to delete messages' },
        { status: 500 }
      );
    }

    // Optionally delete the tenant as well
    // Comment out if you want to keep tenant records
    const { error: tenantError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)
      .eq('user_id', user.id);

    if (tenantError) {
      console.error('Error deleting tenant:', tenantError);
      // Don't fail if tenant deletion fails - messages are already deleted
    }

    return NextResponse.json({ 
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
