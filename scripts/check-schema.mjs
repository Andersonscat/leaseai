import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: rows, error: err } = await supabase.from('properties').select('*').limit(1);
  if (err) {
      console.error("Select error:", err);
  } else {
      console.log("Columns present in the first row:");
      if (rows.length > 0) {
        console.log(Object.keys(rows[0]));
      } else {
        console.log("No rows found. Sending a dummy insert payload to see if columns exist:");
        const res = await supabase.from('properties').insert([{
          type: 'rent',
          address: 't',
          city: '1',
          state: '2',
          zip_code: '1',
          price_monthly: 1000,
          beds: null,
          baths: null,
          sqft: null,
          pet_policy: {allowed: true},
          parking_type: 'none',
          parking_available: false,
          status: 'available',
          description: '',
          amenities: [],
          features: [],
          rules: [],
          images: [],
          walk_score: null,
          transit_score: null,
          lease_term_min: 12,
          available_from: null,
          application_fee: null,
          security_deposit: null,
          furnished: false,
          laundry_type: 'none',
          ai_assisted: true
        }]).select();
        
        console.log("Insert Test Result:");
        if (res.error) {
          console.error(res.error);
        } else {
          console.log("Insert succeeeded! Columns are fine.");
          // Delete test row
          await supabase.from('properties').delete().eq('id', res.data[0].id);
        }
      }
  }
}

checkSchema();
