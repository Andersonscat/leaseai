const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'realtoros/1.0';

export interface GeoCoords {
  lat: number;
  lng: number;
}

/**
 * Geocode an address or city name to coordinates using OpenStreetMap Nominatim.
 * Free, no API key required. Rate limit: 1 req/sec (enforced by caller if batching).
 */
export async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  if (!address?.trim()) return null;

  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.[0]?.lat || !data?.[0]?.lon) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

/**
 * Haversine formula: calculate distance between two lat/lng points in miles.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Map distance in miles to a 0..1 location score.
 *
 *   0–10 mi  → 1.00  (same city core)
 *  10–25 mi  → 0.80  (suburb, e.g. Seattle→Bothell)
 *  25–50 mi  → 0.55  (nearby metro, e.g. Seattle→Tacoma)
 *  50–100 mi → 0.25  (same region but far)
 *  100+ mi   → 0.05  (different region, e.g. Seattle→Spokane)
 */
export function distanceToLocationScore(miles: number): number {
  if (miles <= 10) return 1.0;
  if (miles <= 25) return 0.80;
  if (miles <= 50) return 0.55;
  if (miles <= 100) return 0.25;
  return 0.05;
}
