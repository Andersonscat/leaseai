/**
 * Run properties migration using @supabase/supabase-js
 * Creates an exec_sql RPC function first, then uses it for DDL
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aifbyfmzrlthmqlepxhk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// Step A: Create the exec_sql helper function via REST (DDL through RPC is the way)
// We'll use the PostgREST /rpc endpoint but first need to register it.
// Instead, let's try using supabase.from() with raw SQL via the query interface.

async function runSQL(sql) {
  // Supabase JS v2 supports .rpc() for calling stored procedures
  // For DDL we need to go lower — use fetch directly to the PostgREST endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'params=single-object',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
}

// Actually, the simplest approach that works with Supabase service key:
// Use the Supabase pg-meta API which IS exposed on the project subdomain

async function execSQL(query) {
  const url = `${SUPABASE_URL}/pg-meta/v1/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

const migrations = [
  // Test first
  `SELECT table_name FROM information_schema.tables WHERE table_name = 'properties'`,
];

for (const m of migrations) {
  try {
    const result = await execSQL(m);
    console.log('OK:', JSON.stringify(result).substring(0, 100));
  } catch (e) {
    console.error('ERR:', e);
  }
}
