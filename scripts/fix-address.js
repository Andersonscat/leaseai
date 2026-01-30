
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAddress() {
  console.log('🔍 Looking for property with fake address...');

  // Update specific address seen in screenshot
  const targetFakeAddress = '456 Peers Fall St.';
  const newRealAddress = '400 Broad St, Seattle, WA 98109'; // Space Needle

  // First, Check if it exists
  const { data: properties, error: findError } = await supabase
    .from('properties')
    .select('id, address')
    .ilike('address', '%Peers Fall%');

  if (findError) {
    console.error('Error finding property:', findError);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log('⚠️ No property found with "Peers Fall" in address.');
    console.log('Updating the most recently created property instead...');
    
    const { data: recentProps, error: recentError } = await supabase
      .from('properties')
      .select('id, address')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (recentProps && recentProps.length > 0) {
       await updateProperty(recentProps[0].id, newRealAddress);
    } else {
       console.log('❌ No properties found in database at all.');
    }
    return;
  }

  console.log(`Found ${properties.length} property(ies) to fix.`);
  
  for (const prop of properties) {
    await updateProperty(prop.id, newRealAddress);
  }
}

async function updateProperty(id, newAddress) {
  const { error } = await supabase
    .from('properties')
    .update({ address: newAddress })
    .eq('id', id);

  if (error) {
    console.error(`❌ Failed to update property ${id}:`, error.message);
  } else {
    console.log(`✅ Updated property ${id} address to: "${newAddress}"`);
  }
}

fixAddress();
