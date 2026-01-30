
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAllColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking all required columns in "properties"...');
  
  const requiredColumns = [
    'city', 'state', 'zip_code', 'parking_available', 
    'walk_score', 'transit_score', 'lease_term', 
    'amenities', 'features', 'rules', 'images'
  ];

  // Try to select each column individually to see what's missing
  for (const col of requiredColumns) {
    const { error } = await supabase
      .from('properties')
      .select(col)
      .limit(1);

    if (error) {
      console.log(`❌ Column "${col}" is MISSING. (${error.message})`);
    } else {
      console.log(`✅ Column "${col}" exists.`);
    }
  }
}

checkAllColumns();
