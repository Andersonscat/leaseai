export interface TenantData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  budget?: string;
  budget_min?: number;
  budget_max?: number;
  move_in_date?: string;
  requirements?: string;
  bedrooms?: number;
  property_type?: string;
  preferred_neighborhoods?: string;
  has_pets?: boolean;
  occupants?: number;
  parking_needed?: boolean;
  lease_term_months?: number;
  qualification_status?: 'new' | 'qualifying' | 'qualified' | 'disqualified';
}

export interface TenantQuestionnaire {
  fullName?: { value: string; confidence: number };
  email?: { value: string; confidence: number };
  phone?: { value: string; confidence: number };
  budgetMax?: { value: number; confidence: number };
  budgetMin?: { value: number; confidence: number };
  incomeMonthly?: { value: number; confidence: number };
  creditScore?: { value: number; confidence: number };
  moveInDate?: { value: string; confidence: number };
  leaseTermMonths?: { value: number; confidence: number };
  occupantsCount?: { value: number; confidence: number };
  bedrooms?: { value: number; confidence: number };
  neighborhoods?: { value: string[]; confidence: number };
  petsDetails?: { value: string; confidence: number };
  hasPets?: { value: boolean; confidence: number };
  parkingNeeded?: { value: boolean; confidence: number };
  floorPreference?: { value: 'ground' | 'upper' | 'any'; confidence: number };
  conflicts?: string[];
}

export interface Property {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  status: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  price_monthly?: number;
  beds?: number;
  baths?: number;
  bathrooms?: number;
  sqft?: number;
  city?: string;
  state?: string;
  type?: string;
  available_from?: string;
  pet_policy?: string;
  price_amount?: number;
  parking_type?: string;
  parking_fee?: number;
  application_fee?: number;
  security_deposit?: number;
  utilities_included?: string[];
  utilities_fee?: number;
  building_id?: string;
  unit_number?: string;
  building_name?: string;
  building_amenities?: string[];
  building?: {
    id?: string;
    name?: string;
    amenities?: string[];
    rules?: string[];
    pet_policy?: string;
    parking_type?: string;
    walk_score?: number;
    transit_score?: number;
  };
}

export interface KnownClientFields {
  budget_max?: number;
  bedrooms?: number;
  move_in_date?: string;
  occupants?: number;
  has_pets?: boolean;
  pet_details?: any;
  lease_duration?: string;
  property_type?: string; // "rent" | "buy"
  preferred_city?: string;
  preferred_state?: string;
  preferred_neighborhoods?: string[];
  must_haves?: string[];
  deal_breakers?: string[];
  furnishing?: string;
  parking_needed?: boolean;
}

export interface ConversationContext {
  tenant: TenantData;
  properties: Property[];
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  conversationSummary?: string;
  lastAction?: string;
  realtorName?: string;
  realtorPhone?: string;
  realtorCompany?: string;
  timezone?: string;
  viewingHoursStart?: string;
  viewingHoursEnd?: string;
  defaultLanguage?: string;
  knownFields?: KnownClientFields;
  oauthRefreshToken?: string;
  preRankedMatches?: Array<{
    address: string;
    score: number;
    reason: string;
    price?: any;
    beds?: number;
    baths?: number;
    sqft?: number;
  }>;
}

export interface AiAnalysis {
  thought_process: string;
  thoughts?: {
    analyze?: string;
    search?: string;
    reason?: string;
    draft?: string;
  };
  intent: 'booking_confirmed' | 'inquiry' | 'general';
  action: 'book_calendar' | 'reply' | 'send_listing' | 'escalate';
  escalation_reason?: string;
  action_params?: {
    start_time: string;
    property_address: string;
    client_name?: string;
    duration_minutes?: number;
  };
  extractedData?: Record<string, any>;
  summary?: {
    client: string;
    interests: string;
    concerns: string;
    next_step: string;
  } | string;
  priority?: 'hot' | 'warm' | 'cold';
  suggestedProperties?: string[];
  listing_addresses?: string[];
  photo_mode?: boolean;
  pending_checks?: {
    property_address: string;
    question: string;
  }[];
  propertyMatches?: {
    address: string;
    score: number;
    reason: string;
  }[];
}

export interface VerificationResult {
  hasHallucinations: boolean;
  hallucinatedAddresses: string[];
  reason?: string;
}

export interface ClusterBreakdown {
  budget: number;
  layout: number;
  location: number;
  timeline: number;
  amenities: number;
  lifestyle: number;
}

export interface ScoringResult {
  score: number;
  reason: string;
  clusters: ClusterBreakdown;
  disqualified?: string;
  isNearby?: boolean;
}

export interface RankedPropertyMatch {
  property: PropertyLike;
  score: number;
  reason: string;
  clusters?: ClusterBreakdown;
  isNearby?: boolean;
}

export interface BrainResult {
  analysis: AiAnalysis;
}

export type TenantLike = Partial<TenantData> & Record<string, any>;
export type PropertyLike = Record<string, any>;
