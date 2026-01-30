
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('🧪 Testing Property Schema Insert...');

  // Using a nil UUID for user_id to test structure. 
  // If this fails specifically on FK, it means tables exist and columns exist.
  // If it fails on "column not found", schema is wrong.
  
  // Try to find a real user first to make it a cleaner test if possible
  let userId = '00000000-0000-0000-0000-000000000000';
  
  // NOTE: This insert mock object matches the Zillow schema upgrade
  const mockProperty = {
    user_id: userId, 
    type: 'rent',
    address: '123 Test St, Zillowville',
    price: '$2,500', 
    beds: 2,
    baths: 2.0,
    sqft: '1000',
    pets: 'allowed',
    status: 'Draft',

    // NEW ZILLOW FIELDS - Verification Targets
    price_amount: 2500,
    available_from: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    lease_term_min: 12,
    application_fee: 50,
    security_deposit: 2500,
    utilities_fee: 150,
    utilities_included: ['Water', 'Sewage'],
    pet_policy: 'small_dogs',
    pet_fee: 50,
    pet_deposit: 300,
    parking_type: 'garage',
    parking_fee: 100,
    laundry_type: 'in_unit',
    furnished: true
  };

  try {
    const { data, error } = await supabase
      .from('properties')
      .insert(mockProperty)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '42703') { // Undefined column
        console.error('❌ FAIL: Schema migration missing. Database does not have new columns.');
        console.error('Missing column error:', error.message);
        process.exit(1);
      } else if (error.code === '23503') { // FK violation (user_id)
         console.log('✅ PASS (Implicit): New columns exist! (Failed only on User ID foreign key, which is expected)');
         console.log('Use this script with a valid user_id to fully insert, but schema presence is verified.');
         process.exit(0);
      } else {
        console.error('❌ Error:', error.message, error.code);
        process.exit(1);
      }
    } else {
      console.log('✅ SUCCESS: Property inserted with all new fields!');
      // Cleanup
      if (data?.id) {
        await supabase.from('properties').delete().eq('id', data.id);
        console.log('🧹 Cleaned up test property.');
      }
      process.exit(0);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

testInsert();
