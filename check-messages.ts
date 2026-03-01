import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('created_at, sender_name, sender_type, message_text')
    .ilike('sender_name', '%Aaron Smith%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) console.error(error);
  else console.log(JSON.stringify(messages, null, 2));
}

check();
