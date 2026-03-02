/**
 * Standardized amenities catalog — single source of truth for the entire system.
 * Keys are snake_case identifiers stored in DB and AI. Labels are display names.
 * Aliases teach the AI to recognize free-text synonyms → canonical key.
 */

export interface AmenityDef {
  key: string;
  label: string;
  category: AmenityCategory;
  aliases: string[]; // free-text synonyms the AI uses for matching
  icon?: string;
}

export type AmenityCategory =
  | 'appliances'
  | 'climate'
  | 'space'
  | 'building'
  | 'parking'
  | 'connectivity'
  | 'views'
  | 'security'
  | 'pet';

export const AMENITIES_CATALOG: AmenityDef[] = [
  // ─── Appliances ────────────────────────────────────────────────
  { key: 'dishwasher',          label: 'Dishwasher',             category: 'appliances', aliases: ['dishwasher', 'dish washer'] },
  { key: 'washer_dryer_inunit', label: 'In-Unit Washer/Dryer',   category: 'appliances', aliases: ['in-unit washer', 'in unit washer/dryer', 'washer dryer in unit', 'in-unit laundry', 'washer/dryer included'] },
  { key: 'washer_dryer_hookup', label: 'W/D Hookup',             category: 'appliances', aliases: ['washer dryer hookup', 'w/d hookup', 'laundry hookup'] },
  { key: 'refrigerator',        label: 'Refrigerator',           category: 'appliances', aliases: ['fridge', 'refrigerator'] },
  { key: 'microwave',           label: 'Microwave',              category: 'appliances', aliases: ['microwave', 'microwave oven'] },
  { key: 'oven_stove',          label: 'Oven/Stove',             category: 'appliances', aliases: ['oven', 'stove', 'range', 'gas stove', 'electric stove'] },
  { key: 'garbage_disposal',    label: 'Garbage Disposal',       category: 'appliances', aliases: ['garbage disposal', 'disposal'] },
  { key: 'tv',                  label: 'TV',                     category: 'appliances', aliases: ['tv', 'television', 'smart tv', 'flatscreen', 'flat screen'] },
  { key: 'furnished',           label: 'Furnished',              category: 'appliances', aliases: ['furnished', 'fully furnished', 'comes furnished'] },

  // ─── Climate ────────────────────────────────────────────────────
  { key: 'ac_central',          label: 'Central A/C',            category: 'climate',    aliases: ['central ac', 'central air', 'central a/c', 'central air conditioning'] },
  { key: 'ac_window',           label: 'Window A/C',             category: 'climate',    aliases: ['window ac', 'window unit', 'window air conditioning'] },
  { key: 'forced_air_heat',     label: 'Forced Air Heat',        category: 'climate',    aliases: ['forced air', 'central heat', 'central heating', 'furnace'] },
  { key: 'radiant_heat',        label: 'Radiant Heat',           category: 'climate',    aliases: ['radiator', 'radiant heat', 'baseboard heat'] },
  { key: 'ceiling_fan',         label: 'Ceiling Fan',            category: 'climate',    aliases: ['ceiling fan', 'fan'] },
  { key: 'fireplace',           label: 'Fireplace',              category: 'climate',    aliases: ['fireplace', 'wood burning', 'gas fireplace'] },

  // ─── Space features ─────────────────────────────────────────────
  { key: 'balcony',             label: 'Balcony',                category: 'space',      aliases: ['balcony', 'private balcony', 'juliet balcony'] },
  { key: 'patio',               label: 'Patio',                  category: 'space',      aliases: ['patio', 'private patio', 'ground floor patio'] },
  { key: 'terrace',             label: 'Terrace',                category: 'space',      aliases: ['terrace', 'private terrace'] },
  { key: 'yard',                label: 'Private Yard',           category: 'space',      aliases: ['yard', 'backyard', 'private yard', 'garden'] },
  { key: 'walk_in_closet',      label: 'Walk-In Closet',         category: 'space',      aliases: ['walk-in closet', 'walk in closet', 'large closet'] },
  { key: 'den_office',          label: 'Den / Office',           category: 'space',      aliases: ['den', 'office', 'home office', 'den/office', 'study'] },
  { key: 'storage_unit',        label: 'Storage Unit',           category: 'space',      aliases: ['storage', 'storage unit', 'extra storage', 'storage room'] },
  { key: 'hardwood_floors',     label: 'Hardwood Floors',        category: 'space',      aliases: ['hardwood', 'hardwood floors', 'wood floors', 'hardwood flooring'] },
  { key: 'high_ceilings',       label: 'High Ceilings',          category: 'space',      aliases: ['high ceilings', 'vaulted ceilings', 'floor to ceiling', '9 foot ceilings', '10 foot ceilings'] },

  // ─── Building amenities ─────────────────────────────────────────
  { key: 'gym',                 label: 'Gym / Fitness Center',   category: 'building',   aliases: ['gym', 'fitness center', 'fitness room', 'workout room', 'exercise room'] },
  { key: 'pool',                label: 'Pool',                   category: 'building',   aliases: ['pool', 'swimming pool', 'rooftop pool'] },
  { key: 'hot_tub',             label: 'Hot Tub / Spa',          category: 'building',   aliases: ['hot tub', 'jacuzzi', 'spa', 'sauna'] },
  { key: 'rooftop_deck',        label: 'Rooftop Deck',           category: 'building',   aliases: ['rooftop', 'roof deck', 'rooftop deck', 'rooftop lounge'] },
  { key: 'doorman',             label: 'Doorman',                category: 'building',   aliases: ['doorman', 'door person', 'attended lobby'] },
  { key: 'concierge',           label: 'Concierge',              category: 'building',   aliases: ['concierge', 'front desk', '24-hour concierge'] },
  { key: 'package_room',        label: 'Package Room',           category: 'building',   aliases: ['package room', 'package locker', 'amazon locker', 'mail room'] },
  { key: 'bike_storage',        label: 'Bike Storage',           category: 'building',   aliases: ['bike storage', 'bicycle storage', 'bike room', 'bike rack'] },
  { key: 'coworking_lounge',    label: 'Coworking / Lounge',     category: 'building',   aliases: ['coworking', 'co-working', 'business center', 'lounge', 'club room', 'common area'] },
  { key: 'elevator',            label: 'Elevator',               category: 'building',   aliases: ['elevator', 'lift'] },
  { key: 'laundry_in_building', label: 'Laundry in Building',    category: 'building',   aliases: ['shared laundry', 'laundry room', 'coin laundry', 'laundry on site'] },

  // ─── Parking ────────────────────────────────────────────────────
  { key: 'parking_garage',      label: 'Garage Parking',         category: 'parking',    aliases: ['garage', 'garage parking', 'covered parking', 'underground parking'] },
  { key: 'parking_surface',     label: 'Surface Parking',        category: 'parking',    aliases: ['parking lot', 'surface parking', 'open parking', 'parking available'] },
  { key: 'parking_street',      label: 'Street Parking',         category: 'parking',    aliases: ['street parking', 'free street parking'] },
  { key: 'ev_charging',         label: 'EV Charging',            category: 'parking',    aliases: ['ev charging', 'electric vehicle charging', 'tesla charger', 'level 2 charging'] },

  // ─── Connectivity ───────────────────────────────────────────────
  { key: 'fiber_internet',      label: 'Fiber Internet',         category: 'connectivity', aliases: ['fiber', 'fiber optic', 'fiber internet', 'gigabit'] },
  { key: 'internet_included',   label: 'Internet Included',      category: 'connectivity', aliases: ['internet included', 'wifi included', 'wi-fi included', 'high speed internet included'] },
  { key: 'cable_ready',         label: 'Cable Ready',            category: 'connectivity', aliases: ['cable', 'cable ready', 'cable included'] },

  // ─── Views ──────────────────────────────────────────────────────
  { key: 'city_view',           label: 'City View',              category: 'views',      aliases: ['city view', 'city views', 'downtown view', 'skyline view'] },
  { key: 'water_view',          label: 'Water View',             category: 'views',      aliases: ['water view', 'ocean view', 'lake view', 'river view', 'bay view'] },
  { key: 'mountain_view',       label: 'Mountain View',          category: 'views',      aliases: ['mountain view', 'mountain views'] },
  { key: 'garden_view',         label: 'Garden / Courtyard View',category: 'views',      aliases: ['garden view', 'courtyard view', 'green view'] },

  // ─── Security ───────────────────────────────────────────────────
  { key: 'key_fob_access',      label: 'Key Fob / Secure Entry', category: 'security',   aliases: ['key fob', 'secure entry', 'secured entry', 'controlled access', 'buzzer'] },
  { key: 'intercom',            label: 'Intercom',               category: 'security',   aliases: ['intercom', 'video intercom', 'buzzer'] },
  { key: 'security_cameras',    label: 'Security Cameras',       category: 'security',   aliases: ['security camera', 'cctv', 'surveillance'] },

  // ─── Pet ────────────────────────────────────────────────────────
  { key: 'pet_friendly',        label: 'Pet Friendly',           category: 'pet',        aliases: ['pet friendly', 'pets allowed', 'cats ok', 'dogs ok', 'pets ok'] },
  { key: 'dog_park',            label: 'Dog Park / Run',         category: 'pet',        aliases: ['dog park', 'dog run', 'dog area', 'pet area'] },
];

/** Fast lookup: canonical key → definition */
export const AMENITY_BY_KEY = Object.fromEntries(
  AMENITIES_CATALOG.map(a => [a.key, a])
);

/** All canonical keys as a flat list (for AI prompt) */
export const ALL_AMENITY_KEYS = AMENITIES_CATALOG.map(a => a.key);

/** Alias map: lowercase alias → canonical key */
export const AMENITY_ALIAS_MAP: Record<string, string> = {};
for (const amenity of AMENITIES_CATALOG) {
  for (const alias of amenity.aliases) {
    AMENITY_ALIAS_MAP[alias.toLowerCase()] = amenity.key;
  }
}

/**
 * Normalize free-text amenity string to canonical key.
 * Returns the key if matched, null if no match.
 */
export function normalizeAmenity(text: string): string | null {
  const lower = text.toLowerCase().trim();
  if (AMENITY_ALIAS_MAP[lower]) return AMENITY_ALIAS_MAP[lower];
  // Partial match fallback
  for (const [alias, key] of Object.entries(AMENITY_ALIAS_MAP)) {
    if (lower.includes(alias) || alias.includes(lower)) return key;
  }
  return null;
}

/**
 * Normalize an array of free-text amenities to canonical keys.
 * Deduplicates results.
 */
export function normalizeAmenities(items: string[]): string[] {
  const keys = new Set<string>();
  for (const item of items) {
    const key = normalizeAmenity(item);
    if (key) keys.add(key);
  }
  return Array.from(keys);
}

/** Category labels for display */
export const CATEGORY_LABELS: Record<AmenityCategory, string> = {
  appliances:    'Appliances',
  climate:       'Climate',
  space:         'Space',
  building:      'Building',
  parking:       'Parking',
  connectivity:  'Connectivity',
  views:         'Views',
  security:      'Security',
  pet:           'Pet',
};
