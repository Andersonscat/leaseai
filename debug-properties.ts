// Debug script to check properties in database
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProperties() {
  console.log('🔍 Checking properties for user: b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9\n');
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', 'b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${data?.length || 0} properties:\n`);
  
  data?.forEach((prop, i) => {
    console.log(`${i + 1}. ${prop.address}`);
    console.log(`   Price: ${prop.price}`);
    console.log(`   Bedrooms: ${prop.bedrooms}`);
    console.log(`   Status: ${prop.status}`);
    console.log(`   ID: ${prop.id}\n`);
  });
  
  // Check for Pike Street
  const pikeStreet = data?.find(p => p.address.includes('Pike'));
  if (pikeStreet) {
    console.log('✅ Pike Street property FOUND in database');
  } else {
    console.log('❌ Pike Street property NOT FOUND in database');
    console.log('⚠️  AI is hallucinating this property!');
  }
}

checkProperties();
