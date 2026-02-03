
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('created_at, sender_type, message_text, tenant_id, gmail_message_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Last 10 messages:');
  data.forEach(m => {
    console.log(`[${m.created_at}] ${m.sender_type}: ${m.message_text.substring(0, 50)}... (GmailID: ${m.gmail_message_id || 'NONE'})`);
  });

  console.log('\nLast 5 appointments:');
  const { data: appts, error: apptError } = await supabase
    .from('appointments')
    .select('created_at, title, start_time, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!apptError && appts) {
    appts.forEach(a => {
      console.log(`[${a.created_at}] ${a.title} at ${a.start_time} (Status: ${a.status})`);
    });
  }
}

checkMessages();
