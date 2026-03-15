import type {
  TenantData,
  TenantLike,
  PropertyLike,
  ClusterBreakdown,
  ScoringResult,
  RankedPropertyMatch,
} from '@/lib/ai/types';
import { haversineDistance, distanceToLocationScore } from '@/lib/geocoding';

// ─── CLUSTER WEIGHTS ────────────────────────────────────────────────────────
// Location is the heaviest because you can negotiate price, move-in date,
// even room count — but you cannot move a building to another place.
const CLUSTER_WEIGHTS = {
  budget:    0.20,
  layout:    0.15,
  location:  0.35,
  timeline:  0.10,
  amenities: 0.10,
  lifestyle: 0.10,
} as const;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function parsePetPolicy(raw: string): boolean {
  const p = raw.toLowerCase();
  return p.includes('no_pet') || p === 'no_pets' || p === 'no pets' || p.includes('no pets allowed');
}

function collectAllFeatures(property: PropertyLike): string[] {
  const desc = (property.description || '').toLowerCase();
  const amenities = Array.isArray(property.amenities)
    ? property.amenities.map((a: any) => String(a).toLowerCase()) : [];
  const features = property.features
    ? (Array.isArray(property.features) ? property.features : Object.values(property.features))
        .map((f: any) => String(f).toLowerCase())
    : [];
  const buildingAmenities = Array.isArray(property.building_amenities)
    ? property.building_amenities.map((a: any) => String(a).toLowerCase())
    : Array.isArray(property.building?.amenities)
      ? property.building.amenities.map((a: any) => String(a).toLowerCase())
      : [];
  return [...amenities, ...features, ...buildingAmenities, desc];
}

function isPropFurnished(property: PropertyLike, allFeatures: string[]): boolean {
  return allFeatures.some(f => f.includes('furnished')) ||
    property.furnished === true || String(property.furnished || '').toLowerCase() === 'yes';
}

// ─── STATE INFERENCE FROM PROPERTY PORTFOLIO ────────────────────────────────

/**
 * Infer the US state from a city name by cross-referencing the landlord's
 * property portfolio. Returns the state abbreviation (lowercase) if exactly
 * one state matches, or null if ambiguous / no match.
 */
export function inferStateFromProperties(city: string, properties: PropertyLike[]): string | null {
  if (!city || !properties?.length) return null;
  const cityLow = city.toLowerCase().trim();

  const matchingStates = new Set<string>();
  for (const p of properties) {
    const propCity = (p.city || '').toString().toLowerCase().trim();
    const propState = (p.state || '').toString().toLowerCase().trim();
    if (propCity && propState && propCity === cityLow) {
      matchingStates.add(propState);
    }
  }

  if (matchingStates.size === 1) {
    return Array.from(matchingStates)[0];
  }

  if (matchingStates.size === 0) {
    const addrMatchStates = new Set<string>();
    for (const p of properties) {
      const propAddr = (p.address || '').toString().toLowerCase();
      const propState = (p.state || '').toString().toLowerCase().trim();
      if (propState && propAddr.includes(cityLow)) {
        addrMatchStates.add(propState);
      }
    }
    if (addrMatchStates.size === 1) {
      return Array.from(addrMatchStates)[0];
    }
  }

  if (matchingStates.size === 0) {
    const allStates = new Set<string>();
    for (const p of properties) {
      const s = (p.state || '').toString().toLowerCase().trim();
      if (s) allStates.add(s);
    }
    if (allStates.size === 1) return Array.from(allStates)[0];
  }

  return null;
}

// ─── HARD DISQUALIFIERS (pre-filter) ────────────────────────────────────────

function checkHardDisqualifiers(
  tenant: TenantLike,
  property: PropertyLike,
  allFeatures: string[]
): string | null {
  // Distance-based disqualification when coordinates are available
  const tLat = tenant.preferred_lat;
  const tLng = tenant.preferred_lng;
  const pLat = property.lat;
  const pLng = property.lng;
  if (tLat && tLng && pLat && pLng) {
    const miles = haversineDistance(tLat, tLng, pLat, pLng);
    if (miles > 200) {
      return `too far (${Math.round(miles)} mi away)`;
    }
  } else {
    // Fallback: state-level check when no coordinates
    const tenantState = (tenant.preferred_state || '').toString().toLowerCase().trim();
    const propState = (property.state || '').toString().toLowerCase().trim();
    if (tenantState && propState && tenantState !== propState) {
      return `wrong state (want ${tenant.preferred_state}, property in ${property.state || 'unknown'})`;
    }
  }

  const hasPets = tenant.has_pets === true;
  const petPolicy = (property.pet_policy || property.pets || '').toString();
  if (hasPets && parsePetPolicy(petPolicy)) {
    return 'no pets allowed (hard disqualify)';
  }

  const dealBreakers = Array.isArray(tenant.deal_breakers) ? tenant.deal_breakers : [];
  for (const db of dealBreakers) {
    const term = String(db).toLowerCase();
    if (allFeatures.some(ff => ff.includes(term))) {
      return `deal-breaker present: ${term}`;
    }
  }

  return null;
}

function matchesCity(tenantCity: string, propCity: string, propAddr: string): boolean {
  if (!tenantCity) return false;
  return propCity === tenantCity
    || propCity.includes(tenantCity)
    || tenantCity.includes(propCity)
    || propAddr.includes(tenantCity);
}

// ─── CLUSTER SCORING FUNCTIONS ──────────────────────────────────────────────

function scoreBudgetCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string } {
  const budgetMax = tenant.budget_max != null
    ? Number(tenant.budget_max)
    : (tenant.budget ? parseInt(String(tenant.budget).replace(/[^0-9]/g, ''), 10) : null);
  const priceNum = property.price_monthly ?? property.price_amount
    ?? parseInt(String(property.price || '0').replace(/[^0-9]/g, ''));

  if (budgetMax == null || isNaN(priceNum) || budgetMax <= 0) {
    return { value: 0.5, reason: 'budget unknown' };
  }

  const ratio = priceNum / budgetMax;

  if (ratio <= 0.60) return { value: 0.55, reason: 'far below budget' };
  if (ratio <= 0.70) return { value: 0.70, reason: 'below budget' };
  if (ratio <= 0.85) return { value: 0.85, reason: 'under budget' };
  if (ratio <= 1.00) return { value: 1.00, reason: 'within budget' };
  if (ratio <= 1.05) return { value: 0.80, reason: 'slightly over budget' };
  if (ratio <= 1.10) return { value: 0.60, reason: '5-10% over budget' };
  if (ratio <= 1.20) return { value: 0.30, reason: '10-20% over budget' };
  return { value: 0.0, reason: 'far over budget (>20%)' };
}

function scoreLayoutCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string } {
  const bedsNeeded = tenant.bedrooms ?? null;
  const propBeds = property.beds ?? property.bedrooms ?? 0;
  const bathsNeeded = tenant.bathrooms ?? null;
  const propBaths = property.baths ?? property.bathrooms ?? 0;
  const sqftMin = tenant.sqft_min ?? null;
  const propSqft = property.sqft ?? null;

  let bedScore = 1.0;
  let bedReason = '';
  if (bedsNeeded != null) {
    const diff = propBeds - bedsNeeded;
    if (diff >= 1) { bedScore = 0.95; bedReason = 'extra bedroom'; }
    else if (diff === 0) { bedScore = 1.0; bedReason = 'bedrooms match'; }
    else if (diff === -1) { bedScore = 0.3; bedReason = '1 bedroom short'; }
    else { bedScore = 0.0; bedReason = `${Math.abs(diff)} bedrooms short`; }
  }

  let bathScore = 1.0;
  let bathReason = '';
  if (bathsNeeded != null) {
    if (propBaths > bathsNeeded) { bathScore = 1.0; bathReason = 'extra bathroom'; }
    else if (propBaths === bathsNeeded) { bathScore = 1.0; bathReason = 'bathrooms match'; }
    else { bathScore = 0.5; bathReason = 'fewer bathrooms'; }
  }

  let sqftScore = 1.0;
  let sqftReason = '';
  if (sqftMin != null && propSqft != null) {
    const ratio = propSqft / sqftMin;
    if (ratio >= 1.0) { sqftScore = 1.0; sqftReason = 'meets sqft'; }
    else if (ratio >= 0.85) { sqftScore = 0.7; sqftReason = 'slightly small'; }
    else if (ratio >= 0.70) { sqftScore = 0.4; sqftReason = 'undersized'; }
    else { sqftScore = 0.1; sqftReason = 'much too small'; }
  }

  const value = bedScore * 0.60 + bathScore * 0.15 + sqftScore * 0.25;
  const reasons = [bedReason, bathReason, sqftReason].filter(Boolean);
  return { value: Math.min(1, value), reason: reasons.join('; ') || 'layout OK' };
}

function scoreLocationCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string; isNearby: boolean } {
  const tenantCity = (tenant.preferred_city || '').toString().toLowerCase().trim();
  const tenantState = (tenant.preferred_state || '').toString().toLowerCase().trim();
  const propCity = (property.city || '').toString().toLowerCase().trim();
  const propState = (property.state || '').toString().toLowerCase().trim();
  const propAddr = (property.address || '').toString().toLowerCase();
  const propNeighborhood = (property.neighborhood || '').toLowerCase();
  const reasons: string[] = [];
  let isNearby = false;

  const tLat = tenant.preferred_lat;
  const tLng = tenant.preferred_lng;
  const pLat = property.lat;
  const pLng = property.lng;
  const hasCoords = !!(tLat && tLng && pLat && pLng);

  let cityScore = 0.5;
  if (hasCoords) {
    const miles = haversineDistance(tLat, tLng, pLat, pLng);
    cityScore = distanceToLocationScore(miles);
    isNearby = miles > 10 && miles <= 50;
    if (miles <= 10) reasons.push(`in ${property.city || tenantCity} (${Math.round(miles)} mi)`);
    else reasons.push(`${Math.round(miles)} mi from ${tenantCity || 'preferred location'}`);
  } else if (tenantCity) {
    if (matchesCity(tenantCity, propCity, propAddr)) {
      cityScore = 1.0;
      reasons.push(`in ${property.city || tenantCity}`);
    } else if (tenantState && propState && tenantState !== propState) {
      cityScore = 0.0;
      isNearby = false;
      reasons.push(`wrong state (want ${tenantState.toUpperCase()}, got ${propState.toUpperCase()})`);
    } else {
      cityScore = 0.40;
      isNearby = true;
      reasons.push(`nearby city (${property.city || 'unknown'})`);
    }
  }

  const prefNeighborhoods = Array.isArray(tenant.preferred_neighborhoods)
    ? tenant.preferred_neighborhoods.map((n: any) => String(n).toLowerCase())
    : (typeof tenant.preferred_neighborhoods === 'string' && tenant.preferred_neighborhoods
        ? [tenant.preferred_neighborhoods.toLowerCase()] : []);

  let neighborhoodScore = 0.5;
  if (prefNeighborhoods.length > 0) {
    const matched = prefNeighborhoods.some((n: string) =>
      propAddr.includes(n) || propNeighborhood.includes(n) || n.includes(propNeighborhood)
      || propCity.includes(n) || n.includes(propCity)
    );
    if (matched) {
      neighborhoodScore = 1.0;
      reasons.push('preferred neighborhood');
    } else {
      neighborhoodScore = 0.15;
      reasons.push('outside preferred area');
    }
  }

  const walkScore = property.walk_score ?? null;
  const transitScore = property.transit_score ?? null;
  const bikeScore = property.bike_score ?? null;
  const hasWalkabilityData = walkScore != null || transitScore != null || bikeScore != null;

  let walkabilityScore = 0.5;
  if (hasWalkabilityData) {
    const scores = [walkScore, transitScore, bikeScore].filter((s): s is number => s != null);
    walkabilityScore = scores.reduce((sum, s) => sum + s, 0) / (scores.length * 100);
    reasons.push(`walkability ${Math.round(walkabilityScore * 100)}%`);
  }

  const hasCityPref = !!tenantCity;
  const hasNeighborhoodPref = prefNeighborhoods.length > 0;

  let value: number;
  if (hasCityPref && hasNeighborhoodPref && hasWalkabilityData) {
    value = cityScore * 0.50 + neighborhoodScore * 0.25 + walkabilityScore * 0.25;
  } else if (hasCityPref && hasNeighborhoodPref) {
    value = cityScore * 0.60 + neighborhoodScore * 0.40;
  } else if (hasCityPref && hasWalkabilityData) {
    value = cityScore * 0.65 + walkabilityScore * 0.35;
  } else if (hasCityPref) {
    value = cityScore;
  } else if (hasNeighborhoodPref && hasWalkabilityData) {
    value = neighborhoodScore * 0.65 + walkabilityScore * 0.35;
  } else if (hasNeighborhoodPref) {
    value = neighborhoodScore;
  } else if (hasWalkabilityData) {
    value = walkabilityScore;
  } else {
    value = 0.5;
    reasons.push('location data limited');
  }

  return { value: Math.min(1, value), reason: reasons.join('; ') || 'location OK', isNearby };
}

function scoreTimelineCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string } {
  const moveIn = tenant.move_in_date ? new Date(tenant.move_in_date) : null;
  const availableFrom = property.available_from ? new Date(property.available_from) : null;

  if (!moveIn || !availableFrom || isNaN(availableFrom.getTime())) {
    return { value: 0.5, reason: 'timeline unknown' };
  }

  const daysAfter = Math.round((availableFrom.getTime() - moveIn.getTime()) / (24 * 60 * 60 * 1000));

  if (daysAfter <= 0) return { value: 1.0, reason: 'available on time' };
  if (daysAfter <= 7) return { value: 0.8, reason: 'available within a week' };
  if (daysAfter <= 14) return { value: 0.5, reason: 'available in 1-2 weeks' };
  if (daysAfter <= 30) return { value: 0.2, reason: 'available in 2-4 weeks' };
  return { value: 0.0, reason: 'available much later' };
}

function scoreAmenitiesCluster(
  tenant: TenantLike,
  property: PropertyLike,
  allFeatures: string[]
): { value: number; reason: string } {
  const mustHaves = Array.isArray(tenant.must_haves) ? tenant.must_haves : [];
  const tenantFurnishing = tenant.furnishing ? String(tenant.furnishing).toLowerCase() : null;
  const wantsFurnished = tenantFurnishing === 'yes' || tenantFurnishing === 'fully_furnished' || tenantFurnishing === 'furnished'
    || mustHaves.some((m: any) => String(m).toLowerCase() === 'furnished');
  const propFurnished = isPropFurnished(property, allFeatures);

  const reasons: string[] = [];
  let totalChecks = 0;
  let matchedChecks = 0;

  if (wantsFurnished) {
    totalChecks++;
    if (propFurnished) { matchedChecks++; reasons.push('furnished'); }
    else { reasons.push('not furnished'); }
  }

  const nonFurnishedMustHaves = mustHaves
    .map((m: any) => String(m).toLowerCase())
    .filter((m: string) => m !== 'furnished');

  for (const term of nonFurnishedMustHaves) {
    totalChecks++;
    if (allFeatures.some(ff => ff.includes(term))) {
      matchedChecks++;
    } else {
      reasons.push(`missing: ${term}`);
    }
  }

  if (totalChecks === 0) return { value: 1.0, reason: 'no specific amenity requirements' };

  const value = matchedChecks / totalChecks;
  const matched = totalChecks - (totalChecks - matchedChecks);
  reasons.unshift(`${matched}/${totalChecks} amenities matched`);
  return { value, reason: reasons.join('; ') };
}

function scoreLifestyleCluster(
  tenant: TenantLike,
  property: PropertyLike,
  allFeatures: string[]
): { value: number; reason: string } {
  const reasons: string[] = [];
  let totalFactors = 0;
  let score = 0;

  const hasPets = tenant.has_pets === true;
  if (hasPets) {
    totalFactors++;
    const petPolicy = (property.pet_policy || property.pets || '').toString();
    if (!parsePetPolicy(petPolicy)) {
      score += 1;
      reasons.push('pets allowed');
    }
  }

  const needsParking = tenant.needs_parking === true || tenant.parking_needed === true;
  if (needsParking) {
    totalFactors++;
    const hasParking = !!property.parking_type || allFeatures.some(f => f.includes('parking') || f.includes('garage'));
    if (hasParking) { score += 1; reasons.push('parking available'); }
    else { reasons.push('no parking'); }
  }

  if (totalFactors === 0) return { value: 1.0, reason: 'no lifestyle constraints' };

  const value = score / totalFactors;
  return { value, reason: reasons.join('; ') || 'lifestyle OK' };
}

// ─── MAIN SCORING FUNCTION ──────────────────────────────────────────────────

/**
 * Weighted cluster-based property match score (0-100).
 * Deterministic — no LLM involvement.
 */
export function scorePropertyMatch(tenant: TenantLike, property: PropertyLike): ScoringResult {
  const allFeatures = collectAllFeatures(property);

  const disqualifyReason = checkHardDisqualifiers(tenant, property, allFeatures);
  if (disqualifyReason) {
    return {
      score: 0,
      reason: disqualifyReason,
      disqualified: disqualifyReason,
      clusters: { budget: 0, layout: 0, location: 0, timeline: 0, amenities: 0, lifestyle: 0 },
    };
  }

  const budget = scoreBudgetCluster(tenant, property);
  const layout = scoreLayoutCluster(tenant, property);
  const location = scoreLocationCluster(tenant, property);
  const timeline = scoreTimelineCluster(tenant, property);
  const amenities = scoreAmenitiesCluster(tenant, property, allFeatures);
  const lifestyle = scoreLifestyleCluster(tenant, property, allFeatures);

  const clusters: ClusterBreakdown = {
    budget: Math.round(budget.value * 100),
    layout: Math.round(layout.value * 100),
    location: Math.round(location.value * 100),
    timeline: Math.round(timeline.value * 100),
    amenities: Math.round(amenities.value * 100),
    lifestyle: Math.round(lifestyle.value * 100),
  };

  const rawScore =
    budget.value   * CLUSTER_WEIGHTS.budget +
    layout.value   * CLUSTER_WEIGHTS.layout +
    location.value * CLUSTER_WEIGHTS.location +
    timeline.value * CLUSTER_WEIGHTS.timeline +
    amenities.value * CLUSTER_WEIGHTS.amenities +
    lifestyle.value * CLUSTER_WEIGHTS.lifestyle;

  const tier1Complete = (tenant.budget_max != null || tenant.budget != null)
    && tenant.bedrooms != null
    && (tenant.move_in_date != null);

  let finalScore = Math.round(rawScore * 100);
  const reasons: string[] = [];

  if (!tier1Complete) {
    finalScore = Math.min(finalScore, 70);
    reasons.push('incomplete Tier 1 data');
  }

  const clusterReasons = [budget, layout, location, timeline, amenities, lifestyle]
    .map(c => c.reason).filter(Boolean);
  reasons.push(...clusterReasons);

  finalScore = Math.max(0, Math.min(100, finalScore));

  return {
    score: finalScore,
    reason: reasons.join('; ') || 'good match',
    clusters,
    isNearby: location.isNearby,
  };
}

const MIN_SCORE = 45;
const INITIAL_RECOMMEND = 3;

/**
 * Deterministic ranked property matches. Use this instead of AI propertyMatches.
 */
export function getRankedPropertyMatches(
  tenant: TenantLike,
  properties: PropertyLike[],
  { maxResults = INITIAL_RECOMMEND, alreadyShown = [] }: { maxResults?: number; alreadyShown?: string[] } = {}
): RankedPropertyMatch[] {
  if (!properties?.length) return [];
  const tenantBeds = tenant.bedrooms ?? null;
  const results: RankedPropertyMatch[] = properties.map(p => {
    const { score, reason, clusters, isNearby } = scorePropertyMatch(tenant, p);
    return { property: p, score, reason, clusters, isNearby };
  });
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const eligible = sorted.filter(r => r.score > 0);
  const qualified = eligible.filter(r => r.score >= MIN_SCORE);
  const pool = qualified.length > 0 ? qualified : (
    eligible.length > 0
      ? eligible.slice(0, 3).map(r => ({ ...r, reason: r.reason + '; best available (low match)' }))
      : []
  );
  let candidates: RankedPropertyMatch[];
  if (alreadyShown.length > 0) {
    const seen = new Set(alreadyShown.map(a => a.toLowerCase()));
    const newOnes = pool.filter(r => !seen.has(r.property.address?.toLowerCase()));
    candidates = newOnes.length > 0 ? newOnes.slice(0, maxResults) : pool.slice(0, maxResults);
  } else {
    candidates = pool.slice(0, maxResults);
  }
  if (tenantBeds != null) {
    const hasMismatch = (r: RankedPropertyMatch) => (r.property.beds ?? r.property.bedrooms ?? 0) < tenantBeds;
    const good = candidates.filter(r => !hasMismatch(r));
    const mismatch = candidates.filter(r => hasMismatch(r));
    return [...good, ...mismatch].slice(0, maxResults);
  }
  return candidates;
}
