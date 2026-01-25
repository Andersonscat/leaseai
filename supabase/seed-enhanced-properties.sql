-- =====================================================
-- SEED DATA: Enhanced Property Information
-- =====================================================
-- This script adds realistic test data to showcase
-- the new property information enhancements
-- =====================================================

-- Update existing properties with enhanced data
-- Run this AFTER the add-property-details.sql migration

-- Example 1: Luxury Downtown Apartment
UPDATE properties 
SET 
  parking_available = true,
  walk_score = 98,
  transit_score = 95,
  lease_term = '12 months',
  utilities_included = '["water", "trash", "heat"]'::jsonb,
  available_date = CURRENT_DATE + INTERVAL '7 days',
  year_built = 2020,
  property_condition = 'excellent',
  flooring_type = 'hardwood',
  appliances_included = '["refrigerator", "oven", "dishwasher", "microwave", "washer", "dryer"]'::jsonb,
  heating_type = 'central',
  cooling_type = 'central_ac',
  floor_number = 15,
  total_floors = 25,
  unit_number = '1505',
  security_deposit = '$2,500',
  application_fee = '$50',
  features = ARRAY[
    'Floor-to-Ceiling Windows',
    'Hardwood Floors Throughout',
    'Granite Countertops',
    'Stainless Steel Appliances',
    'In-Unit Washer/Dryer',
    'Walk-In Closet',
    'Private Balcony',
    'Central AC & Heat',
    'Dishwasher',
    'Gym Access',
    'Doorman Service',
    'Package Room',
    'Rooftop Deck',
    'City Views'
  ],
  rules = ARRAY[
    'No smoking in unit or common areas',
    'Quiet hours: 10pm - 8am on weekdays, 11pm - 9am on weekends',
    'No parties without building management approval',
    'Maximum 2 pets (cats or small dogs under 25lbs)',
    'Guest parking requires 24-hour advance registration',
    'Building amenities reserved for residents only'
  ],
  nearby_places = '{
    "grocery": "2 min walk (Whole Foods)",
    "downtown": "You are downtown",
    "park": "5 min walk (Central Park)",
    "public_transit": "1 min walk (Metro Station)",
    "hospital": "10 min drive (City Hospital)",
    "schools": "8 min walk (Elementary School)",
    "restaurants": "Dozens within 3 blocks",
    "gym": "In building + 5 options within 5 min"
  }'::jsonb
WHERE address LIKE '%Main St%' AND beds = 2;

-- Example 2: Cozy Studio Apartment
UPDATE properties 
SET 
  parking_available = false,
  walk_score = 88,
  transit_score = 92,
  lease_term = '6 months or 12 months',
  utilities_included = '["water", "trash"]'::jsonb,
  available_date = CURRENT_DATE + INTERVAL '14 days',
  year_built = 2015,
  property_condition = 'good',
  flooring_type = 'hardwood',
  appliances_included = '["refrigerator", "oven", "microwave"]'::jsonb,
  heating_type = 'radiator',
  cooling_type = 'window_units',
  floor_number = 3,
  total_floors = 5,
  unit_number = '3B',
  security_deposit = '$1,200',
  application_fee = '$35',
  features = ARRAY[
    'Updated Kitchen',
    'Hardwood Floors',
    'High Ceilings',
    'Large Windows',
    'Updated Bathroom',
    'High-Speed Internet Ready',
    'On-Site Laundry',
    'Bike Storage',
    'Package Delivery Service'
  ],
  rules = ARRAY[
    'No smoking inside the unit',
    'Quiet hours: 10pm - 8am',
    'No pets allowed',
    'Street parking only (resident permit required)',
    'Laundry room hours: 7am - 10pm'
  ],
  nearby_places = '{
    "grocery": "5 min walk (Trader Joes)",
    "downtown": "15 min bus ride",
    "park": "3 min walk (Neighborhood Park)",
    "public_transit": "2 min walk (Bus Stop)",
    "hospital": "20 min drive",
    "schools": "10 min walk",
    "restaurants": "Many options on main street",
    "coffee_shop": "Starbucks next door"
  }'::jsonb
WHERE beds = 0 OR (beds = 1 AND sqft::INTEGER < 600);

-- Example 3: Family House with Yard
UPDATE properties 
SET 
  parking_available = true,
  walk_score = 72,
  transit_score = 65,
  lease_term = '12 months (negotiable)',
  utilities_included = '[]'::jsonb,
  available_date = CURRENT_DATE + INTERVAL '30 days',
  year_built = 2005,
  property_condition = 'good',
  flooring_type = 'mixed',
  appliances_included = '["refrigerator", "oven", "dishwasher", "microwave", "washer", "dryer"]'::jsonb,
  heating_type = 'forced_air',
  cooling_type = 'central_ac',
  security_deposit = 'One month rent',
  application_fee = '$40 per adult',
  pet_deposit = '$500 per pet',
  features = ARRAY[
    'Large Backyard',
    'Updated Kitchen',
    '2-Car Garage',
    'Washer/Dryer Included',
    'Fenced Yard',
    'Fireplace',
    'Central AC & Heat',
    'Hardwood Floors in Living Areas',
    'Large Master Suite',
    'Walk-In Closets',
    'Storage Space',
    'Patio/Deck',
    'Sprinkler System'
  ],
  rules = ARRAY[
    'Lawn care and landscaping is tenant responsibility',
    'No smoking inside the house',
    'Pets negotiable with additional deposit',
    'Quiet neighborhood - please respect neighbors',
    'Snow removal required in winter (driveway and walkway)',
    'No commercial vehicles in driveway',
    'Garage door must remain closed when not in use'
  ],
  nearby_places = '{
    "grocery": "10 min drive (Safeway)",
    "downtown": "25 min drive",
    "park": "5 min walk (Community Park with Playground)",
    "public_transit": "15 min walk (Bus Stop)",
    "hospital": "15 min drive",
    "schools": "8 min walk (Rated A+ Elementary)",
    "restaurants": "Shopping center 10 min drive",
    "library": "7 min walk"
  }'::jsonb
WHERE beds >= 3 AND type = 'rent';

-- Add some features and rules to ALL properties that don't have them yet
UPDATE properties 
SET 
  features = ARRAY[
    'Updated Interior',
    'Ample Storage',
    'Good Natural Light'
  ],
  rules = ARRAY[
    'No smoking inside',
    'Quiet hours: 10pm - 8am',
    'Renters insurance required'
  ]
WHERE features IS NULL OR array_length(features, 1) IS NULL;

-- Set reasonable walk scores based on property type and location
UPDATE properties 
SET 
  walk_score = 85 + (RANDOM() * 10)::INTEGER,
  transit_score = 80 + (RANDOM() * 15)::INTEGER
WHERE address LIKE '%downtown%' OR address LIKE '%Downtown%';

UPDATE properties 
SET 
  walk_score = 60 + (RANDOM() * 15)::INTEGER,
  transit_score = 55 + (RANDOM() * 20)::INTEGER
WHERE (address LIKE '%Ave%' OR address LIKE '%St%') 
  AND walk_score IS NULL;

-- Set parking for properties based on type
UPDATE properties 
SET parking_available = true
WHERE beds >= 2 AND parking_available IS NULL;

UPDATE properties 
SET parking_available = false
WHERE beds <= 1 AND parking_available IS NULL;

-- Set default lease term
UPDATE properties 
SET lease_term = '12 months'
WHERE type = 'rent' AND lease_term IS NULL;

-- Add default nearby places for properties without them
UPDATE properties 
SET nearby_places = '{
  "grocery": "Walking distance",
  "downtown": "Short drive",
  "park": "Nearby",
  "public_transit": "Accessible"
}'::jsonb
WHERE nearby_places IS NULL;

-- Verify the updates
SELECT 
  address,
  beds,
  parking_available,
  walk_score,
  transit_score,
  array_length(features, 1) as feature_count,
  array_length(rules, 1) as rules_count,
  lease_term
FROM properties
ORDER BY created_at DESC
LIMIT 10;

-- Check sample data
SELECT 
  'Properties with parking:' as stat,
  COUNT(*) as count
FROM properties 
WHERE parking_available = true
UNION ALL
SELECT 
  'Properties with features:',
  COUNT(*)
FROM properties 
WHERE features IS NOT NULL AND array_length(features, 1) > 0
UNION ALL
SELECT 
  'Properties with rules:',
  COUNT(*)
FROM properties 
WHERE rules IS NOT NULL AND array_length(rules, 1) > 0
UNION ALL
SELECT 
  'Properties with walk score:',
  COUNT(*)
FROM properties 
WHERE walk_score IS NOT NULL;

-- Done!
-- Your properties now have rich, Zillow-style information!
