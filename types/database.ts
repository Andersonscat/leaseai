// Database types for Supabase

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>;
      };
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>;
      };
      contracts: {
        Row: Contract;
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Property {
  id: string;
  user_id: string;
  type: 'rent' | 'sale';
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  price: string;
  price_monthly?: number;
  beds: number;
  baths: number;
  sqft: string;
  pets: string;
  status: string;
  description?: string;
  images?: string[];

  amenities?: string[];
  features?: string[];
  rules?: string[];
  utilities_included?: string[];

  parking_type?: string;
  parking_fee?: number;

  walk_score?: number | null;
  transit_score?: number | null;

  available_from?: string;
  lease_term?: string;

  security_deposit?: number;
  utilities_fee?: number;
  application_fee?: number;

  pet_policy?: string;
  ai_assisted?: boolean;

  lat?: number;
  lng?: number;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Tenant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  property_id?: string;
  property_address?: string;
  status: 'Current' | 'Pending' | 'Late Payment' | 'Archived';
  rent_amount?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Financial
  budget_min?: number;
  budget_max?: number;

  // Timeline
  move_in_date?: string;
  lease_duration?: string;

  // Property requirements
  bedrooms?: number;
  bathrooms?: number;
  sqft_min?: number;
  property_type?: string;
  furnishing?: string;

  // Location preferences
  preferred_neighborhoods?: string[];
  preferred_city?: string;
  preferred_state?: string;
  preferred_lat?: number;
  preferred_lng?: number;

  // Occupants & pets
  num_occupants?: number;
  has_pets?: boolean;
  pet_details?: Record<string, unknown> | string;

  // Amenities & deal-breakers
  must_haves?: string[];
  deal_breakers?: string[];
  needs_parking?: boolean;

  // Lead qualification
  lead_score?: number;
  lead_quality?: 'hot' | 'warm' | 'cold' | 'unqualified';
  qualification_status?: string;

  // AI pipeline
  auto_reply_enabled?: boolean;
  last_auto_reply_at?: string;
  source?: string;
  pipeline_stage?: string;
  escalation_reason?: string;
  pending_checks?: unknown[];
  extracted_data?: Record<string, unknown>;

  // External
  gmail_thread_id?: string;
}

export interface Contract {
  id: string;
  user_id: string;
  name: string;
  property_id?: string;
  property_address?: string;
  tenant_id?: string;
  tenant_name?: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Draft';
  start_date?: string;
  end_date?: string;
  content?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  user_id: string;
  property_id?: string;
  tenant_id?: string;
  sender_type: 'landlord' | 'tenant';
  sender_name: string;
  sender_avatar?: string;
  message_text: string;
  is_read?: boolean;
  created_at?: string;
}
