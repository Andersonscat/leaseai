import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_info'); // Or simply query a small subset to see what errors we get, OR run an introspection query via REST ?
  
  // REST API doesn't easily expose schema without role. But we can fetch 1 row from properties.
  const { data: rows, error: err } = await supabase.from('properties').select('*').limit(1);
  if (err) {
      console.error(err);
  } else {
      console.log("Columns present in the first row:");
      if (rows.length > 0) {
        console.log(Object.keys(rows[0]));
      } else {
        console.log("No rows, trying to insert an empty row to see error:");
        const res = await supabase.from('properties').insert([{}]).select();
        console.log(res.error);
      }
  }
}

checkSchema();
