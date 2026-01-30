
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking if "city" column exists in "properties"...');
  
  // Try to select the column
  const { data, error } = await supabase
    .from('properties')
    .select('id, city')
    .limit(1);

  if (error) {
    console.error('❌ Error selecting city column:', error.message);
    if (error.message.includes('column "city" does not exist')) {
      console.log('👉 CONFIRMED: Column "city" is missing.');
    }
  } else {
    console.log('✅ Column "city" EXISTS in the database.');
  }
}

checkSchema();
