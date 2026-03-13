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
