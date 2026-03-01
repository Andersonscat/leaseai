/**
 * LEASE AI — Property Schema
 *
 * Two layers:
 *   1. DbProperty  — mirrors the Supabase `properties` table, grouped into 9 namespaces
 *   2. PropertySpec — clean AI/matching view (flat within each group, no duplication)
 *
 * Use `dbToPropertySpec()` to convert a raw DB row → PropertySpec.
 */

// ─────────────────────────────────────────────────────────
// LAYER 1 — DbProperty (grouped)
// Groups match the Supabase schema but organize columns
// into logical namespaces instead of one flat object.
// ─────────────────────────────────────────────────────────

/** 1. System / metadata fields */
export interface DbPropertyMeta {
  id:                  string;         // uuid PK
  user_id:             string;         // uuid FK → users
  status:              'available' | 'pending' | 'rented' | 'off-market';
  created_at?:         string;         // timestamptz
  updated_at?:         string;         // timestamptz
  deleted_at?:         string;         // timestamptz (soft delete)
  property_parameters?: Record<string, any>; // jsonb — legacy catch-all
}

/** 2. Location & address */
export interface DbPropertyLocation {
  address:         string;             // text
  city?:           string;             // varchar
  state?:          string;             // varchar
  zip_code?:       string;             // varchar
  building_name?:  string;             // varchar — e.g. "The Hudson"
  walk_score?:     number;             // int4  0–100
  transit_score?:  number;             // int4  0–100
  bike_score?:     number;             // int4  0–100
}

/** 3. Unit physical characteristics */
export interface DbPropertyUnit {
  type:               string;          // varchar: 'apartment' | 'house' | 'condo' | 'townhouse' | 'studio' | 'loft'
  beds:               number;          // int4
  baths:              number;          // numeric (allows 1.5, 2.5)
  full_bathrooms?:    number;          // int4
  half_bathrooms?:    number;          // int4
  sqft?:              string;          // varchar — "850" or "850–1000"
  flooring_type?:     string;          // varchar: 'hardwood' | 'carpet' | 'tile' | 'laminate' | 'vinyl'
  furnished?:         boolean;         // bool
  year_built?:        number;          // int4
  property_condition?: string;         // varchar: 'new' | 'renovated' | 'good' | 'fair'
}

/** 4. Pricing & fees */
export interface DbPropertyFinancials {
  price?:            string;           // varchar — canonical base rent (e.g. "2500")
  price_amount?:     number;           // int4    — same value as price, kept for legacy
  security_deposit?: string;           // varchar — e.g. "one month" or "$3,500"
  application_fee?:  string;           // varchar — e.g. "$50"
  utilities_cost?:   string;           // varchar — free-text utility note
  utilities_fee?:    number;           // int4    — flat monthly utility add-on in $
  utilities?:        string;           // _text   — serialized list (legacy)
  utilities_included?: string;         // _text   — human readable included list
}

/** 5. Availability & lease terms */
export interface DbPropertyLease {
  available_from?:     string;         // date YYYY-MM-DD (preferred)
  available_date?:     string;         // date YYYY-MM-DD (legacy, fallback)
  move_in_date?:       string;         // date YYYY-MM-DD — earliest move-in
  lease_term?:         string;         // varchar — e.g. "12 months", "month-to-month"
  lease_term_min?:     number;         // int4    — minimum lease in months
  rules?:              string;         // _text   — house / building rules
}

/** 6. Parking */
export interface DbPropertyParking {
  parking_available?:    boolean;       // bool
  parking?:              string;        // varchar — legacy: "garage" | "street" | "included"
  parking_type?:         string;        // varchar: 'garage' | 'covered' | 'open' | 'street' | 'none'
  garage_type?:          string;        // varchar: 'attached' | 'detached' | 'underground'
  garage_spaces?:        number;        // int4
  parking_spaces_total?: number;        // int4 — total spots at property
  parking_fee?:          number;        // int4 — monthly cost in $
}

/** 7. Pet policy */
export interface DbPropertyPets {
  pets?:        string;                 // varchar — legacy: "allowed" | "no pets" | "cats only"
  pet_policy?:  Record<string, any>;   // jsonb   — structured: { cats, dogs, weight_limit, ... }
  pet_deposit?: string;                 // varchar — e.g. "$500" or "one month"
  pet_fee?:     number;                 // int4    — monthly pet rent in $
}

/** 8. Utilities & climate control */
export interface DbPropertyUtilities {
  air_conditioning?: boolean;           // bool
  cooling_type?:     string;            // varchar: 'central' | 'mini-split' | 'window' | 'none'
  heating_type?:     string;            // varchar: 'forced-air' | 'baseboard' | 'radiant' | 'heat-pump'
  internet_available?: boolean;         // bool
}

/** 9. Interior features & amenities */
export interface DbPropertyFeatures {
  laundry_type?:       string;          // varchar: 'in-unit' | 'shared' | 'hookups-only' | 'none'
  appliances?:         string;          // _text   — e.g. "Dishwasher, Microwave, Refrigerator"
  kitchen_features?:   string;          // _text   — e.g. "Granite counters, Island"
  amenities?:          string;          // _text   — unit-level amenities (free text)
  features?:           string;          // _text   — unit-level features list
  community_features?: string;          // _text   — building/community amenities
  description?:        string;          // text    — marketing description
  images?:             string;          // _text   — serialized array of image URLs
}

/** Full DbProperty row — all columns grouped into 9 namespaces */
export interface DbProperty {
  meta:       DbPropertyMeta;
  location:   DbPropertyLocation;
  unit:       DbPropertyUnit;
  financials: DbPropertyFinancials;
  lease:      DbPropertyLease;
  parking:    DbPropertyParking;
  pets:       DbPropertyPets;
  utilities:  DbPropertyUtilities;
  features:   DbPropertyFeatures;
}

/**
 * Build a DbProperty from a raw flat Supabase row.
 * Call this right after fetching from the DB.
 */
export function rowToDbProperty(row: Record<string, any>): DbProperty {
  return {
    meta: {
      id:                   row.id,
      user_id:              row.user_id,
      status:               row.status ?? 'available',
      created_at:           row.created_at,
      updated_at:           row.updated_at,
      deleted_at:           row.deleted_at,
      property_parameters:  row.property_parameters,
    },
    location: {
      address:        row.address,
      city:           row.city,
      state:          row.state,
      zip_code:       row.zip_code,
      building_name:  row.building_name,
      walk_score:     row.walk_score,
      transit_score:  row.transit_score,
      bike_score:     row.bike_score,
    },
    unit: {
      type:               row.type,
      beds:               row.beds,
      baths:              row.baths,
      full_bathrooms:     row.full_bathrooms,
      half_bathrooms:     row.half_bathrooms,
      sqft:               row.sqft,
      flooring_type:      row.flooring_type,
      furnished:          row.furnished,
      year_built:         row.year_built,
      property_condition: row.property_condition,
    },
    financials: {
      price:              row.price,
      price_amount:       row.price_amount,
      security_deposit:   row.security_deposit,
      application_fee:    row.application_fee,
      utilities_cost:     row.utilities_cost,
      utilities_fee:      row.utilities_fee,
      utilities:          row.utilities,
      utilities_included: row.utilities_included,
    },
    lease: {
      available_from:   row.available_from,
      available_date:   row.available_date,
      move_in_date:     row.move_in_date,
      lease_term:       row.lease_term,
      lease_term_min:   row.lease_term_min,
      rules:            row.rules,
    },
    parking: {
      parking_available:    row.parking_available,
      parking:              row.parking,
      parking_type:         row.parking_type,
      garage_type:          row.garage_type,
      garage_spaces:        row.garage_spaces,
      parking_spaces_total: row.parking_spaces_total,
      parking_fee:          row.parking_fee,
    },
    pets: {
      pets:        row.pets,
      pet_policy:  row.pet_policy,
      pet_deposit: row.pet_deposit,
      pet_fee:     row.pet_fee,
    },
    utilities: {
      air_conditioning: row.air_conditioning,
      cooling_type:     row.cooling_type,
      heating_type:     row.heating_type,
      internet_available: row.internet_available,
    },
    features: {
      laundry_type:       row.laundry_type,
      appliances:         row.appliances,
      kitchen_features:   row.kitchen_features,
      amenities:          row.amenities,
      features:           row.features,
      community_features: row.community_features,
      description:        row.description,
      images:             row.images,
    },
  };
}


// ─────────────────────────────────────────────────────────
// LAYER 2 — PropertySpec (clean AI/matching view)
// Built from DbProperty. No duplication, properly typed.
// ─────────────────────────────────────────────────────────

export interface PropertySpec {
  // System
  id:      string;
  user_id: string;
  status:  'available' | 'pending' | 'rented' | 'off-market';

  location: {
    address:        string;
    city?:          string;
    state?:         string;
    zip_code?:      string;
    building_name?: string;
    walk_score?:    number;
    transit_score?: number;
    bike_score?:    number;
  };

  unit: {
    type:               string;
    beds:               number;
    baths:              number;
    full_bathrooms?:    number;
    half_bathrooms?:    number;
    sqft?:              number;
    flooring_type?:     string;
    furnished?:         boolean;
    year_built?:        number;
    property_condition?: 'new' | 'renovated' | 'good' | 'fair' | string;
  };

  financials: {
    price_monthly:          number;   // Resolved from price or price_amount
    security_deposit?:      string;
    application_fee?:       string;
    utilities_fee_monthly?: number;   // Flat monthly add-on; 0 = all included
    utilities_included?:    string[]; // Parsed list: ['water', 'trash', ...]
    utilities_note?:        string;   // Free-text utility description
  };

  lease: {
    available_from?:        string;   // Canonical date (prefers available_from over available_date)
    move_in_date?:          string;
    lease_term_label?:      string;   // e.g. "12 months"
    lease_term_min_months?: number;
    rules?:                 string[]; // Parsed house rules
  };

  parking: {
    available:    boolean;
    type?:        'garage' | 'covered' | 'open' | 'street' | 'none' | string;
    garage_type?: 'attached' | 'detached' | 'underground' | string;
    spaces?:      number;             // garage_spaces ?? parking_spaces_total
    fee_monthly?: number;             // 0 = included; undefined = N/A
  };

  pets: {
    allowed:            boolean;
    cats_allowed?:      boolean;
    dogs_allowed?:      boolean;
    weight_limit_lbs?:  number;
    breed_restrictions?: string[];
    max_pets?:          number;
    deposit?:           string;
    monthly_fee?:       number;
    notes?:             string;
  };

  utilities: {
    ac:                boolean;
    cooling_type?:     'central' | 'mini-split' | 'window' | 'none' | string;
    heating_type?:     'forced-air' | 'baseboard' | 'radiant' | 'heat-pump' | string;
    internet_available?: boolean;
  };

  features: {
    laundry_type?:       'in-unit' | 'shared' | 'hookups-only' | 'none' | string;
    appliances?:         string[];
    kitchen_features?:   string[];
    unit_amenities?:     string[];   // Parsed from amenities + features
    building_amenities?: string[];   // Parsed from community_features
    description?:        string;
    images?:             string[];
  };
}


// ─────────────────────────────────────────────────────────
// MAPPER — DbProperty → PropertySpec
// ─────────────────────────────────────────────────────────

function parseTextArray(val?: string | null): string[] {
  if (!val) return [];
  const trimmed = val.trim();
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}

function resolvePrice(f: DbPropertyFinancials): number {
  const a = f.price ? parseFloat(f.price.replace(/[^0-9.]/g, '')) : NaN;
  return (!isNaN(a) && a > 0) ? a : (f.price_amount ?? 0);
}

function resolvePets(p: DbPropertyPets): PropertySpec['pets'] {
  const policy = p.pet_policy ?? {};
  const legacy = (p.pets ?? '').toLowerCase();
  const legacyAllowed = /allow|ok|yes|permit/i.test(legacy);
  const legacyDenied = /^no |not allow|not permit/i.test(legacy);

  const allowed =
    'allowed' in policy ? Boolean(policy.allowed) :
    policy.cats || policy.dogs ? true :
    legacyAllowed ? true :
    legacyDenied ? false : false;

  return {
    allowed,
    cats_allowed:       policy.cats ?? (/cat/.test(legacy) ? true : undefined),
    dogs_allowed:       policy.dogs ?? (/dog/.test(legacy) ? true : undefined),
    weight_limit_lbs:   policy.weight_limit ?? policy.weight_limit_lbs,
    breed_restrictions: policy.breed_restrictions
      ? (Array.isArray(policy.breed_restrictions) ? policy.breed_restrictions : [policy.breed_restrictions])
      : undefined,
    max_pets:    policy.max_pets,
    deposit:     p.pet_deposit ?? undefined,
    monthly_fee: p.pet_fee ?? undefined,
    notes:       policy.notes ?? (legacyAllowed || legacyDenied ? undefined : p.pets ?? undefined),
  };
}

export function dbToPropertySpec(db: DbProperty): PropertySpec {
  const { meta, location, unit, financials, lease, parking, pets, utilities, features } = db;

  const parkingAvailable =
    parking.parking_available ??
    (parking.parking ? !/^(none|no|street)$/i.test(parking.parking.trim()) : false);

  const unitAmenities = [
    ...parseTextArray(features.amenities),
    ...parseTextArray(features.features),
  ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

  return {
    id:      meta.id,
    user_id: meta.user_id,
    status:  meta.status,

    location: {
      address:       location.address,
      city:          location.city,
      state:         location.state,
      zip_code:      location.zip_code,
      building_name: location.building_name,
      walk_score:    location.walk_score,
      transit_score: location.transit_score,
      bike_score:    location.bike_score,
    },

    unit: {
      type:               unit.type,
      beds:               unit.beds,
      baths:              unit.baths,
      full_bathrooms:     unit.full_bathrooms,
      half_bathrooms:     unit.half_bathrooms,
      sqft:               unit.sqft ? (parseFloat(unit.sqft.replace(/[^0-9.]/g, '')) || undefined) : undefined,
      flooring_type:      unit.flooring_type,
      furnished:          unit.furnished,
      year_built:         unit.year_built,
      property_condition: unit.property_condition,
    },

    financials: {
      price_monthly:         resolvePrice(financials),
      security_deposit:      financials.security_deposit,
      application_fee:       financials.application_fee,
      utilities_fee_monthly: financials.utilities_fee,
      utilities_included:    parseTextArray(financials.utilities_included || financials.utilities),
      utilities_note:        financials.utilities_cost,
    },

    lease: {
      available_from:        lease.available_from ?? lease.available_date,
      move_in_date:          lease.move_in_date,
      lease_term_label:      lease.lease_term,
      lease_term_min_months: lease.lease_term_min,
      rules:                 parseTextArray(lease.rules),
    },

    parking: {
      available:    parkingAvailable,
      type:         parking.parking_type ?? parking.parking ?? undefined,
      garage_type:  parking.garage_type,
      spaces:       parking.garage_spaces ?? parking.parking_spaces_total,
      fee_monthly:  parking.parking_fee,
    },

    pets: resolvePets(pets),

    utilities: {
      ac:               utilities.air_conditioning ?? false,
      cooling_type:     utilities.cooling_type,
      heating_type:     utilities.heating_type,
      internet_available: utilities.internet_available,
    },

    features: {
      laundry_type:      features.laundry_type,
      appliances:        parseTextArray(features.appliances),
      kitchen_features:  parseTextArray(features.kitchen_features),
      unit_amenities:    unitAmenities,
      building_amenities: parseTextArray(features.community_features),
      description:       features.description,
      images:            parseTextArray(features.images),
    },
  };
}


// ─────────────────────────────────────────────────────────
// CLIENT REQUIREMENTS
// ─────────────────────────────────────────────────────────

export type RequirementLevel = 'required' | 'preferred' | 'excluded';

export interface ClientTimeline {
  move_in_date?:             string;
  move_in_flexibility_days?: number;
  lease_term_min_months?:    number;
  lease_term_ideal_months?:  number;
  lease_term_max_months?:    number;
  decision_timeline?:        'today' | 'this_week' | 'this_month' | 'browsing';
  client_status?:            'browsing' | 'qualifying' | 'ready_to_book' | 'decided';
}

export interface ClientBudget {
  max_monthly_rent?:         number;
  comfortable_monthly_rent?: number;
  utilities_preference?:     'all-in' | 'separate' | 'no-preference';
  deposit_ready?:            boolean;
  can_pay_first_last?:       boolean;
  income_monthly?:           number;
  employment_type?:          'w2' | '1099' | 'self-employed' | 'student' | 'international' | 'other';
  credit_score_range?:       'excellent-750+' | 'good-700-749' | 'fair-650-699' | 'poor-below-650' | 'no-history';
  has_guarantor?:            boolean;
  wants_concessions?:        boolean;
}

export interface ClientLocationPrefs {
  neighborhoods_must?:    string[];
  neighborhoods_nice?:    string[];
  neighborhoods_exclude?: string[];
  commute_destination?:   string;
  commute_max_minutes?:   number;
  commute_mode?:          'car' | 'public-transit' | 'walk' | 'bike' | 'any';
  nearby_must?:           Array<'metro' | 'grocery' | 'park' | 'school' | 'gym' | 'highway'>;
  wants_quiet?:           boolean;
}

export interface ClientHousingPrefs {
  property_types?:   Array<'apartment' | 'house' | 'townhouse' | 'condo' | 'studio' | 'loft' | 'any'>;
  bedrooms_min?:     number;
  bedrooms_ideal?:   number;
  bathrooms_min?:    number;
  sqft_min?:         number;
  floor_preference?: 'ground' | 'upper' | 'top' | 'any';
  wants_elevator?:   boolean;
  wants_view?:       boolean;
  furnished?:        'yes' | 'no' | 'no-preference';
  no_carpet?:        boolean;
  no_basement?:      boolean;
  no_shared_walls?:  boolean;
}

export interface ClientOccupants {
  total_count?:              number;
  adults?:                   number;
  children?:                 number;
  children_ages?:            number[];
  lifestyle?:                'quiet' | 'social' | 'mixed';
  overnight_guests_frequent?: boolean;
  wfh?:                      boolean;
  needs_home_office?:        boolean;
  internet_min_mbps?:        number;
  noise_sensitive?:          boolean;
}

export interface ClientPetPrefs {
  has_pets?:              boolean;
  pet_type?:              Array<'cat' | 'dog' | 'other'>;
  pet_breed?:             string;
  pet_weight_lbs?:        number;
  pet_count?:             number;
  needs_yard?:            boolean;
  needs_dog_park_nearby?: boolean;
}

export interface ClientAmenityPrefs {
  parking?: {
    required:          RequirementLevel;
    type_pref?:        Array<'garage' | 'covered' | 'open' | 'street'>;
    spots_needed?:     number;
    ev_charging_needed?: boolean;
    budget_monthly?:   number;
  };
  laundry?: {
    required:         RequirementLevel;
    must_be_in_unit?: boolean;
  };
  ac_required?:    boolean;
  dishwasher?:     RequirementLevel;
  gym?:            RequirementLevel;
  pool?:           RequirementLevel;
  storage?:        RequirementLevel;
  balcony_patio?:  RequirementLevel;
  amenities_must?: string[];
  amenities_nice?: string[];
}

export interface ClientDocumentation {
  visa_type?:              'us-citizen' | 'green-card' | 'h1b' | 'opt' | 'student' | 'other';
  has_ssn?:                boolean;
  has_eviction_history?:   boolean;
  has_bankruptcy_history?: boolean;
  can_auto_pay?:           boolean;
}

export interface ClientCommunication {
  preferred_channel?: 'sms' | 'whatsapp' | 'email' | 'call';
  decision_makers?:   'solo' | 'couple' | 'family' | 'parents-involved';
  viewing_pref?:      'in-person' | 'virtual' | 'both';
  viewing_days?:      Array<'weekday' | 'weekend'>;
  viewing_times?:     Array<'morning' | 'afternoon' | 'evening'>;
  wants_shortlist?:   boolean;
}

export interface ClientRedLines {
  no_smoking_building?: boolean;
  no_carpet?:           boolean;
  no_ground_floor?:     boolean;
  no_near_highway?:     boolean;
  no_near_school?:      boolean;
  no_near_bar?:         boolean;
  allergies?:           string[];
  other_hard_noes?:     string[];
}

export interface ClientRequirements {
  name?:   string;
  email?:  string;
  phone?:  string;
  source?: string;

  timeline:      ClientTimeline;
  budget:        ClientBudget;
  location:      ClientLocationPrefs;
  housing:       ClientHousingPrefs;
  occupants:     ClientOccupants;
  pets:          ClientPetPrefs;
  amenities:     ClientAmenityPrefs;
  documentation: ClientDocumentation;
  communication: ClientCommunication;
  red_lines:     ClientRedLines;

  qualification_score?:  number;
  qualification_status?: 'new' | 'qualifying' | 'qualified' | 'disqualified';
  notes?:                string;
  collected_at?:         string;
}


// ─────────────────────────────────────────────────────────
// MATCH RESULT
// ─────────────────────────────────────────────────────────

export interface PropertyMatchResult {
  property_id:   string;
  address:       string;
  score:         number;
  matched:       string[];
  gaps:          string[];
  deal_breakers: string[];
  price_delta?:  number;
}


// ─────────────────────────────────────────────────────────
// HELPERS — AI prompt summaries
// ─────────────────────────────────────────────────────────

export function summarizePropertySpec(p: PropertySpec): string {
  const lines = [
    `${p.location.address}${p.location.city ? `, ${p.location.city}` : ''}`,
    `${p.unit.beds}BR / ${p.unit.baths}BA${p.unit.sqft ? ` · ${p.unit.sqft} sqft` : ''} · ${p.unit.type}`,
    `$${p.financials.price_monthly}/mo`,
  ];
  if (p.financials.utilities_included?.length) lines.push(`Utilities included: ${p.financials.utilities_included.join(', ')}`);
  if (p.lease.available_from) lines.push(`Available: ${p.lease.available_from}`);
  if (p.lease.lease_term_label) lines.push(`Lease: ${p.lease.lease_term_label}`);
  if (p.parking.available) lines.push(`Parking: ${p.parking.type ?? 'yes'}${p.parking.fee_monthly ? ` (+$${p.parking.fee_monthly}/mo)` : ' (included)'}`);
  if (p.pets.allowed) {
    const detail = [p.pets.cats_allowed && 'cats', p.pets.dogs_allowed && 'dogs'].filter(Boolean).join('/') || 'pets';
    lines.push(`Pets: ${detail} allowed${p.pets.weight_limit_lbs ? ` (max ${p.pets.weight_limit_lbs}lbs)` : ''}`);
  }
  if (p.utilities.ac) lines.push(`AC: ${p.utilities.cooling_type ?? 'yes'}`);
  if (p.features.laundry_type) lines.push(`Laundry: ${p.features.laundry_type}`);
  if (p.features.building_amenities?.length) lines.push(`Building: ${p.features.building_amenities.slice(0, 5).join(', ')}`);
  return lines.join('\n');
}

export function summarizeClientRequirements(req: Partial<ClientRequirements>): string {
  const lines: string[] = [];
  if (req.timeline?.move_in_date) lines.push(`Move-in: ${req.timeline.move_in_date}${req.timeline.move_in_flexibility_days ? ` ±${req.timeline.move_in_flexibility_days}d` : ''}`);
  if (req.timeline?.lease_term_ideal_months) lines.push(`Lease: ${req.timeline.lease_term_ideal_months} months`);
  if (req.timeline?.decision_timeline) lines.push(`Decision: ${req.timeline.decision_timeline}`);
  if (req.budget?.max_monthly_rent) lines.push(`Budget max: $${req.budget.max_monthly_rent}/mo`);
  if (req.budget?.utilities_preference) lines.push(`Utilities: ${req.budget.utilities_preference}`);
  if (req.budget?.credit_score_range) lines.push(`Credit: ${req.budget.credit_score_range}`);
  if (req.budget?.employment_type) lines.push(`Employment: ${req.budget.employment_type}`);
  if (req.location?.neighborhoods_must?.length) lines.push(`Must-neighborhoods: ${req.location.neighborhoods_must.join(', ')}`);
  if (req.location?.neighborhoods_exclude?.length) lines.push(`Exclude: ${req.location.neighborhoods_exclude.join(', ')}`);
  if (req.location?.commute_destination) lines.push(`Commute to: ${req.location.commute_destination} (max ${req.location.commute_max_minutes}min by ${req.location.commute_mode})`);
  if (req.housing?.bedrooms_min != null) lines.push(`Bedrooms: ${req.housing.bedrooms_min}+`);
  if (req.housing?.bathrooms_min != null) lines.push(`Bathrooms: ${req.housing.bathrooms_min}+`);
  if (req.housing?.property_types?.length) lines.push(`Type: ${req.housing.property_types.join('/')}`);
  if (req.housing?.sqft_min) lines.push(`Min sqft: ${req.housing.sqft_min}`);
  if (req.housing?.furnished) lines.push(`Furnished: ${req.housing.furnished}`);
  if (req.housing?.no_carpet) lines.push(`No carpet`);
  if (req.occupants?.total_count) lines.push(`Occupants: ${req.occupants.total_count} people`);
  if (req.occupants?.wfh) lines.push(`WFH: yes`);
  if (req.occupants?.needs_home_office) lines.push(`Needs home office`);
  if (req.pets?.has_pets) {
    const petLine = ['Pet:', req.pets.pet_type?.join('/'), req.pets.pet_breed, req.pets.pet_weight_lbs ? `${req.pets.pet_weight_lbs}lbs` : null, req.pets.pet_count ? `×${req.pets.pet_count}` : null].filter(Boolean).join(' ');
    lines.push(petLine);
  }
  if (req.amenities?.parking?.required === 'required') lines.push(`Parking: required (${req.amenities.parking.type_pref?.join('/') || 'any'})`);
  if (req.amenities?.laundry?.must_be_in_unit) lines.push(`In-unit laundry: required`);
  if (req.amenities?.ac_required) lines.push(`AC: required`);
  if (req.amenities?.amenities_must?.length) lines.push(`Must-haves: ${req.amenities.amenities_must.join(', ')}`);
  if (req.red_lines?.other_hard_noes?.length) lines.push(`Hard NOs: ${req.red_lines.other_hard_noes.join(', ')}`);
  if (req.red_lines?.allergies?.length) lines.push(`Allergies: ${req.red_lines.allergies.join(', ')}`);
  return lines.length > 0 ? lines.join('\n') : 'No requirements collected yet.';
}
