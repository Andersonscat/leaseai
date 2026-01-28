
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperties() {
  console.log('🔍 Checking properties in database...');
  
  // 1. Get all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, user_id, address, status, price, beds');
    
  if (error) {
    console.error('❌ Error fetching properties:', error);
    return;
  }
  
  console.log(`🏠 Found ${properties.length} total properties in DB.`);
  console.table(properties);
  
  // 2. Get all users to match IDs
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
  } else {
    console.log('\n👤 Users found:');
    users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));
  }
  process.exit(0);
}

checkProperties();
