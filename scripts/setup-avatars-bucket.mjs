#!/usr/bin/env node
/**
 * Run the avatars bucket migration.
 * Requires: SUPABASE_DB_URL or run the SQL manually in Dashboard > SQL Editor.
 *
 * Option 1 - With database URL (from Supabase Dashboard > Project Settings > Database):
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" node scripts/setup-avatars-bucket.mjs
 *
 * Option 2 - Run the SQL manually:
 *   Copy contents of supabase/migrations/20260303_avatars_bucket.sql
 *   Paste in Supabase Dashboard > SQL Editor > Run
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, '../supabase/migrations/20260303_avatars_bucket.sql');

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log('SUPABASE_DB_URL not set. Run the migration manually:\n');
    console.log('1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy and run the contents of: supabase/migrations/20260303_avatars_bucket.sql\n');
    console.log('Or set SUPABASE_DB_URL and run this script again.');
    process.exit(1);
  }

  try {
    const { default: pg } = await import('pg');
    const sql = readFileSync(migrationPath, 'utf8');
    const client = new pg.Client({ connectionString: dbUrl });
    await client.connect();
    await client.query(sql);
    await client.end();
    console.log('✅ Avatars bucket migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

main();
