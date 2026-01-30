
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

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

  // Mock user ID - we need a valid UUID. Using a placeholder or we might fail RLS.
  // Ideally, we should fetch a user first or use service role key.
  // For now, let's try to fetch the first user or use a known one if hardcoded not possible.
  // If we have service role key, RLS is bypassed.
  
  // Checking for service role key usage
  const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`🔑 Using ${isServiceRole ? 'Service Role' : 'Anon'} Key`);

  const mockProperty = {
    // Required fields (based on schema)
    user_id: '00000000-0000-0000-0000-000000000000', // Placeholder, likely will fail FK if not exists. 
    // We should try to get a real user if possible.
    type: 'rent',
    address: '123 Test St, Zillowville',
    price: '$2,500', // Old field
    beds: 2,
    baths: 2.0,
    sqft: '1000',
    pets: 'allowed', // Old field
    status: 'Draft', // Or Available

    // NEW ZILLOW FIELDS
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
    // 1. Check if we can find a user first to avoid FK error
    // If running as service role, we can list users. If anon, we can't.
    // Let's assume the user runs this with a valid user_id or we catch the FK error and that confirms structure at least.
    
    // Attempt insert
    const { data, error } = await supabase
      .from('properties')
      .insert(mockProperty)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '42703') { // Undefined column
        console.error('❌ FAIL: Schema migration missing. Database does not have new columns.');
        console.error('Missing column error:', error.message);
      } else if (error.code === '23503') { // FK violation (user_id)
         console.log('⚠️  Partial Success: Columns exist, but user_id not found (expected). Schema is likely updated!');
         console.log('Error details:', error.message);
      } else {
        console.error('❌ meaningful Error:', error);
      }
    } else {
      console.log('✅ SUCCESS: Property inserted with all new fields!');
      console.log('Inserted ID:', data?.id);
      
      // Cleanup
      if (data?.id) {
        await supabase.from('properties').delete().eq('id', data.id);
        console.log('🧹 Cleaned up test property.');
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testInsert();
