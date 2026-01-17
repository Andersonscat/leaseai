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
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  pets: string;
  status: string;
  description?: string;
  amenities?: string[];
  features?: string[];
  rules?: string[];
  images?: string[];
  created_at?: string;
  updated_at?: string;
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
