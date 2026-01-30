
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOwner() {
  console.log('🔍 Checking latest appointment owner...');
  
  // Get latest appointment
  const { data: apts, error } = await supabase
    .from('appointments')
    .select('id, user_id, title, start_time')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !apts.length) {
    console.log('❌ No appointments found or error:', error);
    return;
  }

  const apt = apts[0];
  console.log('✅ Found Appointment:', apt);
  
  // Get User Email
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(apt.user_id);
  
  if (user) {
    console.log('👤 Owner Email:', user.email);
  } else {
    console.log('❓ Owner User Not Found');
  }
}

checkOwner();
