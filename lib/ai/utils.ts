/**
 * Detect the language of a message using character frequency heuristics.
 * Returns a human-readable language name for prompt injection.
 */
export function detectClientLanguage(text: string): string {
  const cleaned = text.replace(/[^a-zA-Zа-яА-ЯёЁáéíóúñüÁÉÍÓÚÑÜ¿¡\u4e00-\u9fff\uac00-\ud7af\u0600-\u06ff]/g, '');
  if (cleaned.length === 0) return 'English';

  const cyrillic = (cleaned.match(/[а-яА-ЯёЁ]/g) || []).length;
  const spanish = (cleaned.match(/[áéíóúñüÁÉÍÓÚÑÜ¿¡]/g) || []).length;
  const chinese = (cleaned.match(/[\u4e00-\u9fff]/g) || []).length;
  const korean = (cleaned.match(/[\uac00-\ud7af]/g) || []).length;
  const arabic = (cleaned.match(/[\u0600-\u06ff]/g) || []).length;
  const total = cleaned.length;

  if (cyrillic / total > 0.3) return 'Russian';
  if (chinese / total > 0.1) return 'Chinese';
  if (korean / total > 0.1) return 'Korean';
  if (arabic / total > 0.1) return 'Arabic';
  if (spanish / total > 0.05) return 'Spanish';
  return 'English';
}

/**
 * Strip ---PROPERTIES_JSON--- and ---PHOTOS_JSON--- blocks from message text
 * so conversation history sent to AI doesn't contain raw JSON noise.
 */
export function cleanMessageForHistory(text: string): string {
  return text
    .replace(/\n*---PROPERTIES_JSON---[\s\S]*?---END_PROPERTIES_JSON---/g, '')
    .replace(/\n*---PHOTOS_JSON---[\s\S]*?---END_PHOTOS_JSON---/g, '')
    .trim();
}

const DISTANCE_PATTERN = /\b(?:how\s+far|distance|далеко|расстояние|сколько\s+(?:ехать|минут|километр|миль)|close\s+(?:to|is\s+it)|near\s+(?:to|by)?)\b.*?\b(downtown|city\s*center|центр[а-я]*|[\w\s]{2,30}?(?:,\s*\w{2})?)\s*\??$/i;
const DISTANCE_SIMPLE = /\b(?:how\s+far|distance|далеко|расстояние|сколько\s+(?:ехать|минут)|close\s+to|near)\b/i;

export interface DistanceEnrichment {
  detected: boolean;
  targetPlace: string | null;
  distanceMiles: number | null;
  propertyAddress: string | null;
  enrichmentText: string | null;
}

/**
 * Detect distance/location questions and compute actual distance using geocoding.
 * Returns enrichment text that can be injected into Voice prompt.
 */
export async function detectAndEnrichDistance(
  clientMessage: string,
  conversationHistory: { role: string; content: string }[],
  properties: { address?: string }[]
): Promise<DistanceEnrichment> {
  const noResult: DistanceEnrichment = { detected: false, targetPlace: null, distanceMiles: null, propertyAddress: null, enrichmentText: null };

  if (!DISTANCE_SIMPLE.test(clientMessage)) return noResult;

  const match = clientMessage.match(DISTANCE_PATTERN);
  let targetPlace = match?.[1]?.trim() || null;

  if (!targetPlace) {
    const words = clientMessage.replace(/[?!.]/g, '').split(/\s+/);
    const fromIdx = words.findIndex(w => /^(from|to|до|от)$/i.test(w));
    if (fromIdx >= 0 && fromIdx < words.length - 1) {
      targetPlace = words.slice(fromIdx + 1).join(' ');
    }
  }
  if (!targetPlace) return { ...noResult, detected: true };

  const lastDiscussedAddr = findLastDiscussedProperty(conversationHistory, properties);
  if (!lastDiscussedAddr) return { ...noResult, detected: true, targetPlace };

  try {
    const { geocodeAddress, haversineDistance } = await import('@/lib/geocoding');
    const [propCoords, targetCoords] = await Promise.all([
      geocodeAddress(lastDiscussedAddr),
      geocodeAddress(targetPlace),
    ]);
    if (!propCoords || !targetCoords) return { ...noResult, detected: true, targetPlace, propertyAddress: lastDiscussedAddr };

    const miles = haversineDistance(propCoords.lat, propCoords.lng, targetCoords.lat, targetCoords.lng);
    const km = miles * 1.60934;
    const enrichmentText = `FACTUAL DATA: The property at ${lastDiscussedAddr} is approximately ${miles.toFixed(1)} miles (${km.toFixed(1)} km) from ${targetPlace}.`;
    console.log(`📍 Distance enrichment: ${enrichmentText}`);
    return { detected: true, targetPlace, distanceMiles: miles, propertyAddress: lastDiscussedAddr, enrichmentText };
  } catch (err) {
    console.error('📍 Distance enrichment failed:', err);
    return { ...noResult, detected: true, targetPlace, propertyAddress: lastDiscussedAddr };
  }
}

function findLastDiscussedProperty(
  history: { role: string; content: string }[],
  properties: { address?: string }[]
): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role !== 'assistant') continue;
    const text = history[i].content;
    for (const p of properties) {
      if (p.address && text.toLowerCase().includes(p.address.toLowerCase())) {
        return p.address;
      }
    }
  }
  return properties[0]?.address || null;
}

/**
 * PII MASKING UTILITY
 * Masks sensitive information for logging or external agents.
 */
export function maskPII(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL-REDACTED]')
    .replace(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE-REDACTED]');
}

/**
 * Flatten nested extractedData (from AI) to flat tenant fields for scoring
 */
export function flattenExtractedData(ed: Record<string, any> | null | undefined): Record<string, any> {
  if (!ed || typeof ed !== 'object') return {};
  const flat: Record<string, any> = {};
  const budgetVal = ed.budget?.budget_usd ?? ed.budget?.max_monthly_rent ?? ed.budget_max;
  if (budgetVal != null) flat.budget_max = budgetVal;
  const moveIn = ed.timeline?.move_in_date ?? ed.move_in_date;
  if (moveIn) flat.move_in_date = moveIn;
  if (ed.timeline?.lease_term_ideal_months) flat.lease_duration = `${ed.timeline.lease_term_ideal_months}_months`;
  const bedrooms = ed.housing?.bedrooms_min;
  if (bedrooms != null) flat.bedrooms = bedrooms;
  const bathrooms = ed.housing?.bathrooms_min;
  if (bathrooms != null) flat.bathrooms = bathrooms;
  if (ed.housing?.furnished) {
    flat.furnishing = ed.housing.furnished;
  } else if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.includes('furnished')) {
    flat.furnishing = 'yes';
  }
  if (Array.isArray(ed.housing?.property_types) && ed.housing.property_types.length > 0) {
    flat.property_type = ed.housing.property_types[0];
  }
  const occupants = ed.occupants?.total_count;
  if (occupants != null) flat.num_occupants = occupants;
  if (ed.pets?.has_pets !== undefined) flat.has_pets = ed.pets.has_pets;
  else if (ed.has_pets !== undefined) flat.has_pets = ed.has_pets;
  if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.length > 0) {
    flat.must_haves = ed.amenities.desired_features;
  }
  if (Array.isArray(ed.amenities?.deal_breakers) && ed.amenities.deal_breakers.length > 0) {
    flat.deal_breakers = ed.amenities.deal_breakers;
  }
  if (ed.amenities?.parking?.required === 'required') {
    flat.needs_parking = true;
  } else if (Array.isArray(ed.amenities?.desired_features) &&
    ed.amenities.desired_features.some((f: string) => f.includes('parking'))) {
    flat.needs_parking = true;
  }
  if (Array.isArray(ed.location?.neighborhoods_must) && ed.location.neighborhoods_must.length > 0) {
    flat.preferred_neighborhoods = ed.location.neighborhoods_must;
  }
  if (ed.location?.city && typeof ed.location.city === 'string' && ed.location.city.trim()) {
    flat.preferred_city = ed.location.city.trim();
  }
  if (ed.location?.state && typeof ed.location.state === 'string' && ed.location.state.trim()) {
    flat.preferred_state = ed.location.state.trim();
  }
  return flat;
}

/**
 * Extract Tier 1 + Tier 2 known fields from a raw tenant DB row
 * for injection into the agent's context.
 */
export function extractKnownFields(tenant: Record<string, any>): import('@/lib/ai/types').KnownClientFields {
  const kf: import('@/lib/ai/types').KnownClientFields = {};

  if (tenant.budget_max != null && tenant.budget_max > 0) kf.budget_max = Number(tenant.budget_max);
  if (tenant.bedrooms != null && tenant.bedrooms > 0) kf.bedrooms = Number(tenant.bedrooms);
  if (tenant.move_in_date) kf.move_in_date = tenant.move_in_date;
  if (tenant.num_occupants != null || tenant.occupants != null) {
    kf.occupants = Number(tenant.num_occupants ?? tenant.occupants);
  }
  if (tenant.has_pets === true || tenant.has_pets === false) kf.has_pets = tenant.has_pets;
  if (tenant.pet_details) kf.pet_details = tenant.pet_details;
  if (tenant.lease_duration) kf.lease_duration = tenant.lease_duration;
  if (tenant.property_type) kf.property_type = tenant.property_type;
  if (tenant.preferred_city) kf.preferred_city = tenant.preferred_city;
  if (tenant.preferred_state) kf.preferred_state = tenant.preferred_state;
  if (Array.isArray(tenant.preferred_neighborhoods) && tenant.preferred_neighborhoods.length > 0) {
    kf.preferred_neighborhoods = tenant.preferred_neighborhoods;
  }
  if (Array.isArray(tenant.must_haves) && tenant.must_haves.length > 0) kf.must_haves = tenant.must_haves;
  if (Array.isArray(tenant.deal_breakers) && tenant.deal_breakers.length > 0) kf.deal_breakers = tenant.deal_breakers;
  if (tenant.furnishing) kf.furnishing = tenant.furnishing;
  if (tenant.needs_parking || tenant.parking_needed) kf.parking_needed = true;

  return kf;
}

/**
 * Programmatically format booking details to ensure perfect Markdown/HTML output
 */
export function formatBookingDetails(params: {
  address: string;
  calendarLink: string;
  eventTime: string;
  realtorName: string;
  realtorPhone: string;
}): string {
  const encodedAddress = encodeURIComponent(params.address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  let displayTime = params.eventTime;
  try {
    const date = new Date(params.eventTime);
    if (!isNaN(date.getTime())) {
      displayTime = date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (e) {}

  return `
---
**Booking Details:**

*   **Property:** [${params.address}](${mapsUrl})
*   **Time:** [${displayTime}](${params.calendarLink})
*   **Agent:** ${params.realtorName} (${params.realtorPhone})
`.trim();
}
