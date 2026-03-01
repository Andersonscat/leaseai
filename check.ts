import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data } = await supabase.from('messages').select('id, is_read, sender_type').eq('is_read', false);
  console.log("Unread messages:", data);
}
main();
