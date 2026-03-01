import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
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

  // Fetch raw messages  
  const { data: messages, error: msgsError } = await supabase
    .from('messages')
    .select('id, tenant_id, sender_type, sender_name, message_text, source, created_at, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, email, status, created_at')
    .eq('user_id', user.id)
    .limit(20);

  return NextResponse.json({
    user_id: user.id,
    messages_count: messages?.length ?? 0,
    tenants_count: tenants?.length ?? 0,
    messages_error: msgsError?.message,
    tenants_error: tenantsError?.message,
    messages: messages?.map(m => ({
      id: m.id,
      tenant_id: m.tenant_id,
      sender_type: m.sender_type,
      sender_name: m.sender_name,
      text_preview: m.message_text?.substring(0, 80),
      source: m.source,
      created_at: m.created_at,
    })),
    tenants,
  });
}
