-- LeaseAI Test Data
-- This file adds sample data for testing

-- Create a test user ID (in production this would come from auth.users)
-- For testing, we'll use a fixed UUID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- Insert Properties (7 rent, 6 sale)
INSERT INTO properties (id, user_id, type, address, price, beds, baths, sqft, pets, status, description, amenities, features, images) VALUES
-- RENT Properties
('10000000-0000-0000-0000-000000000001', test_user_id, 'rent', '1234 Maple Street, Toronto, ON', '$2,500/mo', 2, 1.5, '1,200', 'Cats allowed', 'Available', 
 'Beautiful 2-bedroom apartment in the heart of downtown Toronto. Modern kitchen with stainless steel appliances, hardwood floors throughout, and large windows providing plenty of natural light.',
 ARRAY['In-unit laundry', 'Parking', 'Gym', 'Pool'],
 ARRAY['Hardwood floors', 'Stainless appliances', 'Walk-in closet'],
 ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']),

('10000000-0000-0000-0000-000000000002', test_user_id, 'rent', '5678 Oak Avenue, Vancouver, BC', '$3,200/mo', 3, 2, '1,800', 'Dogs allowed', 'Available',
 'Spacious 3-bedroom house with backyard. Perfect for families with pets. Updated kitchen and bathrooms, large living spaces.',
 ARRAY['Backyard', 'Garage', 'Pet-friendly'],
 ARRAY['Updated kitchen', 'Large backyard', 'Fireplace'],
 ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800']),

('10000000-0000-0000-0000-000000000003', test_user_id, 'rent', '9012 Pine Road, Calgary, AB', '$1,800/mo', 1, 1, '800', 'No pets', 'Available',
 'Cozy 1-bedroom condo with stunning city views. Perfect for young professionals. Building amenities include gym and rooftop terrace.',
 ARRAY['Gym', 'Rooftop terrace', 'Concierge'],
 ARRAY['City views', 'Modern finishes', 'Open concept'],
 ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800']),

('10000000-0000-0000-0000-000000000004', test_user_id, 'rent', '3456 Elm Street, Montreal, QC', '$2,100/mo', 2, 1, '1,000', 'Cats allowed', 'Available',
 'Charming 2-bedroom in a historic building. High ceilings, large windows, and close to public transit.',
 ARRAY['Near metro', 'Historic building', 'Storage locker'],
 ARRAY['High ceilings', 'Original moldings', 'Bright'],
 ARRAY['https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800']),

('10000000-0000-0000-0000-000000000005', test_user_id, 'rent', '7890 Birch Lane, Ottawa, ON', '$2,800/mo', 3, 2.5, '1,600', 'Dogs allowed', 'Available',
 'Modern 3-bedroom townhouse with finished basement. Great for families, close to schools and parks.',
 ARRAY['Finished basement', 'Parking', 'Close to schools'],
 ARRAY['Modern kitchen', 'Backyard patio', 'Ensuite bathroom'],
 ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800']),

('10000000-0000-0000-0000-000000000006', test_user_id, 'rent', '2345 Cedar Drive, Halifax, NS', '$1,600/mo', 2, 1, '900', 'No pets', 'Available',
 'Affordable 2-bedroom apartment near the waterfront. Quiet neighborhood with easy access to downtown.',
 ARRAY['Near waterfront', 'Quiet area', 'On-site laundry'],
 ARRAY['Waterfront proximity', 'Updated bathroom', 'Balcony'],
 ARRAY['https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800']),

('10000000-0000-0000-0000-000000000007', test_user_id, 'rent', '6789 Spruce Street, Winnipeg, MB', '$1,400/mo', 1, 1, '700', 'Cats allowed', 'Available',
 'Compact 1-bedroom perfect for students or young professionals. All utilities included.',
 ARRAY['Utilities included', 'Near university', 'Free parking'],
 ARRAY['All inclusive', 'Newly renovated', 'Utilities included'],
 ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']),

-- SALE Properties
('20000000-0000-0000-0000-000000000001', test_user_id, 'sale', '1111 Luxury Lane, Toronto, ON', '$850,000', 3, 2, '2,200', 'Yes', 'Available',
 'Stunning 3-bedroom luxury condo in prime downtown location. Floor-to-ceiling windows, chef''s kitchen, and premium finishes throughout.',
 ARRAY['Concierge', 'Gym', 'Pool', 'Parking'],
 ARRAY['Luxury finishes', 'Smart home', 'Floor-to-ceiling windows'],
 ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800']),

('20000000-0000-0000-0000-000000000002', test_user_id, 'sale', '2222 Family Way, Vancouver, BC', '$1,200,000', 4, 3, '2,800', 'Yes', 'Available',
 'Beautiful family home with large backyard. Recently renovated with modern finishes. Great schools nearby.',
 ARRAY['Large yard', 'Garage', 'Renovated'],
 ARRAY['Modern kitchen', 'Master ensuite', 'Hardwood floors'],
 ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800']),

('20000000-0000-0000-0000-000000000003', test_user_id, 'sale', '3333 Starter Street, Calgary, AB', '$320,000', 2, 1, '1,100', 'No', 'Available',
 'Perfect starter home for first-time buyers. Well-maintained with recent updates.',
 ARRAY['Updated', 'Move-in ready', 'Parking'],
 ARRAY['Recent updates', 'Good condition', 'Quiet street'],
 ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800']),

('20000000-0000-0000-0000-000000000004', test_user_id, 'sale', '4444 Penthouse Plaza, Montreal, QC', '$650,000', 2, 2, '1,500', 'Yes', 'Available',
 'Sophisticated penthouse with panoramic city views. High-end appliances and luxury amenities.',
 ARRAY['Rooftop terrace', 'Gym', 'Concierge', 'Valet'],
 ARRAY['Panoramic views', 'High-end appliances', 'Marble bathrooms'],
 ARRAY['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800']),

('20000000-0000-0000-0000-000000000005', test_user_id, 'sale', '5555 Investment Ave, Ottawa, ON', '$480,000', 3, 2, '1,700', 'Yes', 'Available',
 'Great investment property in growing neighborhood. Potential for rental income.',
 ARRAY['Investment potential', 'Good location', 'Parking'],
 ARRAY['Growing area', 'Rental potential', 'Well-maintained'],
 ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800']),

('20000000-0000-0000-0000-000000000006', test_user_id, 'sale', '6666 Waterfront Way, Halifax, NS', '$720,000', 3, 2, '1,900', 'Yes', 'Available',
 'Breathtaking waterfront property with private dock. Spectacular ocean views from every room.',
 ARRAY['Private dock', 'Waterfront', 'Ocean views'],
 ARRAY['Waterfront access', 'Deck', 'Modern updates'],
 ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800']);

-- Insert Tenants
INSERT INTO tenants (id, user_id, name, email, phone, avatar, property_id, property_address, status, lease_start, lease_end, rent_amount, payment_status, move_in_date) VALUES
('30000000-0000-0000-0000-000000000001', test_user_id, 'John Smith', 'john.smith@example.com', '+1 (555) 123-4567', 'https://i.pravatar.cc/150?img=12',
 '10000000-0000-0000-0000-000000000001', '1234 Maple Street, Toronto', 'Current', '2024-01-01', '2025-12-31', '$2,500', 'Paid', '2024-01-01'),

('30000000-0000-0000-0000-000000000002', test_user_id, 'Emma Johnson', 'emma.j@example.com', '+1 (555) 234-5678', 'https://i.pravatar.cc/150?img=45',
 '10000000-0000-0000-0000-000000000002', '5678 Oak Avenue, Vancouver', 'Current', '2024-03-01', '2026-02-28', '$3,200', 'Paid', '2024-03-01'),

('30000000-0000-0000-0000-000000000003', test_user_id, 'Michael Brown', 'mbrown@example.com', '+1 (555) 345-6789', 'https://i.pravatar.cc/150?img=33',
 '10000000-0000-0000-0000-000000000003', '9012 Pine Road, Calgary', 'Late Payment', '2024-06-01', '2025-05-31', '$1,800', 'Late', '2024-06-01'),

('30000000-0000-0000-0000-000000000004', test_user_id, 'Sarah Davis', 'sarah.davis@example.com', '+1 (555) 456-7890', 'https://i.pravatar.cc/150?img=27',
 NULL, NULL, 'Pending', NULL, NULL, NULL, 'Pending', NULL),

('30000000-0000-0000-0000-000000000005', test_user_id, 'David Wilson', 'dwilson@example.com', '+1 (555) 567-8901', 'https://i.pravatar.cc/150?img=51',
 '10000000-0000-0000-0000-000000000004', '3456 Elm Street, Montreal', 'Current', '2024-02-01', '2025-01-31', '$2,100', 'Paid', '2024-02-01'),

('30000000-0000-0000-0000-000000000006', test_user_id, 'Lisa Anderson', 'lisa.a@example.com', '+1 (555) 678-9012', 'https://i.pravatar.cc/150?img=9',
 '10000000-0000-0000-0000-000000000005', '7890 Birch Lane, Ottawa', 'Archived', '2023-01-01', '2023-12-31', '$2,800', 'Completed', '2023-01-01');

-- Insert Contracts
INSERT INTO contracts (id, user_id, name, property_id, property_address, tenant_id, tenant_name, status, start_date, end_date, content) VALUES
('40000000-0000-0000-0000-000000000001', test_user_id, 'Lease Agreement - 1234 Maple St',
 '10000000-0000-0000-0000-000000000001', '1234 Maple Street, Toronto', 
 '30000000-0000-0000-0000-000000000001', 'John Smith',
 'Active', '2024-01-01', '2025-12-31', 'Standard residential lease agreement...'),

('40000000-0000-0000-0000-000000000002', test_user_id, 'Lease Agreement - 5678 Oak Ave',
 '10000000-0000-0000-0000-000000000002', '5678 Oak Avenue, Vancouver',
 '30000000-0000-0000-0000-000000000002', 'Emma Johnson',
 'Active', '2024-03-01', '2026-02-28', 'Standard residential lease agreement...'),

('40000000-0000-0000-0000-000000000003', test_user_id, 'Lease Agreement - 9012 Pine Rd',
 '10000000-0000-0000-0000-000000000003', '9012 Pine Road, Calgary',
 '30000000-0000-0000-0000-000000000003', 'Michael Brown',
 'Active', '2024-06-01', '2025-05-31', 'Standard residential lease agreement...'),

('40000000-0000-0000-0000-000000000004', test_user_id, 'Lease Agreement - 3456 Elm St',
 '10000000-0000-0000-0000-000000000004', '3456 Elm Street, Montreal',
 '30000000-0000-0000-0000-000000000005', 'David Wilson',
 'Active', '2024-02-01', '2025-01-31', 'Standard residential lease agreement...'),

('40000000-0000-0000-0000-000000000005', test_user_id, 'Draft Lease - New Property',
 NULL, NULL, NULL, NULL, 'Draft', NULL, NULL, 'Draft lease agreement pending details...'),

('40000000-0000-0000-0000-000000000006', test_user_id, 'Completed Lease - 7890 Birch',
 '10000000-0000-0000-0000-000000000005', '7890 Birch Lane, Ottawa',
 '30000000-0000-0000-0000-000000000006', 'Lisa Anderson',
 'Completed', '2023-01-01', '2023-12-31', 'Standard residential lease agreement...');

-- Insert Messages
INSERT INTO messages (user_id, property_id, tenant_id, sender_type, sender_name, sender_avatar, message_text, is_read, created_at) VALUES
(test_user_id, '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'tenant', 'John Smith', 'https://i.pravatar.cc/150?img=12',
 'Hi, I have a question about the parking situation.', true, NOW() - INTERVAL '2 days'),

(test_user_id, '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'landlord', 'You', NULL,
 'Sure! Each unit has one assigned parking spot in the underground garage.', true, NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),

(test_user_id, '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'tenant', 'Emma Johnson', 'https://i.pravatar.cc/150?img=45',
 'The heating system seems to not be working properly.', false, NOW() - INTERVAL '1 day'),

(test_user_id, '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'tenant', 'Michael Brown', 'https://i.pravatar.cc/150?img=33',
 'I need a few more days to pay this month''s rent.', false, NOW() - INTERVAL '3 hours');

-- Insert Interested Tenants (for property cards)
INSERT INTO interested_tenants (property_id, tenant_id, status, unread_count, last_message, last_message_time) VALUES
('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'active', 0, 'Sure! Each unit has one assigned parking spot...', NOW() - INTERVAL '2 days'),
('10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'active', 1, 'The heating system seems to not be working properly.', NOW() - INTERVAL '1 day'),
('10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'active', 1, 'I need a few more days to pay this month''s rent.', NOW() - INTERVAL '3 hours');

END $$;
