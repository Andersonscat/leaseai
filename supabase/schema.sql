-- LeaseAI Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  type VARCHAR(10) NOT NULL CHECK (type IN ('rent', 'sale')),
  address TEXT NOT NULL,
  price VARCHAR(50) NOT NULL,
  beds INTEGER NOT NULL,
  baths DECIMAL(3,1) NOT NULL,
  sqft VARCHAR(20) NOT NULL,
  pets VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available',
  description TEXT,
  amenities TEXT[], -- Array of amenities
  features TEXT[], -- Array of features
  rules TEXT[], -- Array of rules
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants Table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users (landlord)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar VARCHAR(500),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_address TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Current', 'Pending', 'Late Payment', 'Archived')),
  lease_start DATE,
  lease_end DATE,
  rent_amount VARCHAR(50),
  payment_status VARCHAR(20),
  move_in_date DATE,
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts Table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users (landlord)
  name VARCHAR(255) NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  property_address TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_name VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Pending', 'Completed', 'Draft')),
  start_date DATE,
  end_date DATE,
  content TEXT, -- Full contract text
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table (for chat functionality)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users (landlord)
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('landlord', 'tenant')),
  sender_name VARCHAR(255) NOT NULL,
  sender_avatar VARCHAR(500),
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interested Tenants (for property inquiries)
CREATE TABLE interested_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  unread_count INTEGER DEFAULT 0,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);

CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_property_id ON tenants(property_id);

CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_property_id ON contracts(property_id);
CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_property_id ON messages(property_id);
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_interested_tenants_property_id ON interested_tenants(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interested_tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Properties
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Tenants
CREATE POLICY "Users can view their own tenants"
  ON tenants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tenants"
  ON tenants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tenants"
  ON tenants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Contracts
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
  ON contracts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Interested Tenants
CREATE POLICY "Users can view interested tenants for their properties"
  ON interested_tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = interested_tenants.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
