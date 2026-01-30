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
  // Core fields
  id: string;
  user_id: string;
  type: 'rent' | 'sale';
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  pets: string;
  status: string;
  description?: string;
  images?: string[];
  
  // Lists and arrays
  amenities?: string[];
  features?: string[];
  rules?: string[];
  appliances?: string[];
  utilities?: string[];
  utilities_included?: string[];
  community_features?: string[];
  kitchen_features?: string[];
  
  // Parking
  parking?: string;
  parking_available?: boolean;
  garage_type?: string;
  garage_spaces?: number;
  parking_spaces_total?: number;
  
  // Location scores
  walk_score?: number | null;
  transit_score?: number | null;
  bike_score?: number | null;
  
  // Interior details
  flooring_type?: string;
  furnished?: boolean;
  laundry_type?: string;
  parking_type?: string;
  parking_fee?: number;
  full_bathrooms?: number;
  half_bathrooms?: number;
  
  // Building & condition
  year_built?: number;
  property_condition?: string;
  building_name?: string;
  
  // Heating & cooling
  heating_type?: string;
  cooling_type?: string;
  air_conditioning?: boolean;
  
  // Lease terms
  lease_term?: string;
  lease_term_min?: number;
  available_date?: string;
  available_from?: string; // Date string YYYY-MM-DD
  move_in_date?: string;
  
  // Financial
  security_deposit?: number;
  pet_deposit?: number;
  utilities_cost?: string; // Keep as string for now if legacy, or migrate to utilities_fee
  utilities_fee?: number;
  application_fee?: number;
  price_amount?: number;
  
  // Utilities
  internet_available?: boolean;
  
  // Pet details
  pet_policy?: string; // 'allowed', 'cats_only', 'small_dogs', 'no_pets'
  pet_fee?: number;
  
  // Legacy Pet Policy Object (Deprecated)
  // pet_policy_object?: { ... }
  
  // Timestamps
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
  lease_start?: string;
  lease_end?: string;
  rent_amount?: string;
  payment_status?: string;
  move_in_date?: string;
  emergency_contact?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
