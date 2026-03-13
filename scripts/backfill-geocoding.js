/**
 * Backfill lat/lng for existing properties that don't have coordinates.
 * Uses free Nominatim (OpenStreetMap) API — 1 request/sec rate limit.
 *
 * Usage: node scripts/backfill-geocoding.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function geocode(address) {
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`,
    { headers: { 'User-Agent': 'realtoros-backfill/1.0' } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.[0]?.lat) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, address, city, state')
    .is('lat', null)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to fetch properties:', error.message);
    process.exit(1);
  }

  console.log(`Found ${properties.length} properties without coordinates.\n`);

  let success = 0;
  let failed = 0;

  for (const prop of properties) {
    const query = [prop.address, prop.city, prop.state].filter(Boolean).join(', ');
    const coords = await geocode(query);

    if (coords) {
      const { error: updateErr } = await supabase
        .from('properties')
        .update({ lat: coords.lat, lng: coords.lng })
        .eq('id', prop.id);

      if (updateErr) {
        console.log(`  FAIL  ${query} — DB error: ${updateErr.message}`);
        failed++;
      } else {
        console.log(`  OK    ${query} → (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        success++;
      }
    } else {
      console.log(`  SKIP  ${query} — geocoding returned no results`);
      failed++;
    }

    await sleep(1100); // Nominatim rate limit: 1 req/sec
  }

  console.log(`\nDone: ${success} geocoded, ${failed} failed/skipped out of ${properties.length}`);
}

main();
