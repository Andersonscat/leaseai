
export type EvidenceSource = 'header' | 'text' | 'chat' | 'url';

export interface Evidence {
  field: string; // e.g., "pricing.rent"
  quote: string;
  source: EvidenceSource;
}

export interface Conflict {
  field: string;
  description: string; // e.g., "Header says Garage, Text says Carport"
  sources: EvidenceSource[];
}

export interface Question {
  question: string;
  reason: 'missing_data' | 'conflict';
  related_fields: string[];
}

export interface PropertyParameters {
  // A) Identity / Type
  identity: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    unit_number?: string;
    type?: 'apartment' | 'condo' | 'townhouse' | 'sfh' | 'unknown';
    managed_by?: 'owner' | 'pm' | 'hoa' | 'unknown';
  };

  // B) Pricing & Fees
  pricing: {
    rent_monthly?: number;
    security_deposit?: number;
    application_fee_per_adult?: number;
    holding_deposit?: number;
    holding_deposit_policy?: 'refundable' | 'non-refundable' | 'applies_to_deposit' | 'unknown';
    admin_move_in_fees?: number;
    utilities_flat_fee?: number; // if required
  };

  // C) Availability & Lease
  availability: {
    available_date?: string; // ISO date or "now"
    available_now?: boolean;
    lease_term_min_months?: number;
    lease_term_options?: string; // e.g. "6-12 months"
    sublease_allowed?: boolean;
    smoking_allowed?: boolean;
  };

  // D) Layout
  layout: {
    beds?: number;
    baths?: number;
    sqft?: number;
    storage_notes?: string;
  };

  // E) Furnishing & Condition
  condition: {
    furnished?: boolean;
    remodeled?: boolean;
    remodeled_notes?: string;
    flooring?: 'hardwood' | 'carpet' | 'tile' | 'laminate' | 'mixed' | 'unknown';
    appliances?: string[]; // fridge, stove, etc.
  };

  // F) Utilities & HVAC
  utilities: {
    included_in_rent?: string[]; // water, trash, gas, etc.
    tenant_pays?: string[];
    heating_type?: string;
    ac_type?: string;
  };

  // G) Laundry & Parking
  amenities_access: {
    laundry_type?: 'in-unit' | 'shared' | 'hookups' | 'none' | 'unknown';
    washer_dryer_included?: boolean;
    parking_type?: 'garage' | 'carport' | 'assigned' | 'street' | 'uncovered' | 'none';
    parking_spaces?: number;
    parking_fee_monthly?: number;
  };

  // H) Pet Policy
  pets: {
    allowed?: boolean;
    cats_allowed?: boolean;
    dogs_allowed?: boolean;
    weight_limit_lbs?: number;
    breed_restrictions?: string;
    pet_fee_one_time?: number;
    pet_deposit?: number;
    pet_rent_monthly?: number;
  };

  // I) Community
  community: {
    gated?: boolean;
    amenities?: string[]; // pool, gym
  };

  // J) Screening
  screening: {
    income_multiple?: number; // e.g. 3.0
    credit_score_min?: number;
    background_check_required?: boolean;
    eviction_history_allowed?: boolean;
  };

  // K) Data Quality (Metadata)
  audit: {
    conflicts: Conflict[];
    unknowns: string[]; // List of fields that were explicitly checked but not found
    questions_to_ask_agent: Question[];
    evidence: Record<string, string>; // Key: "group.field", Value: "Quote (Source)"
    last_updated?: string;
    source_url?: string;
  };
}

export const PROPERTY_PARAMS_DEFAULT: PropertyParameters = {
  identity: {},
  pricing: {},
  availability: {},
  layout: {},
  condition: {},
  utilities: {},
  amenities_access: {},
  pets: {},
  community: {},
  screening: {},
  audit: { conflicts: [], unknowns: [], questions_to_ask_agent: [], evidence: {} }
};
