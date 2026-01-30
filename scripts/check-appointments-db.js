
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing DB credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAppointments() {
  console.log('🔍 Checking appointments table...');
  const { data, error } = await supabase.from('appointments').select('*');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${data.length} appointments.`);
  data.forEach(apt => {
    console.log(`- [${apt.status}] ${apt.title} @ ${apt.start_time} (ID: ${apt.id})`);
  });
}

checkAppointments();
