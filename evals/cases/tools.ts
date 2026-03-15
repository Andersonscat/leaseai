import type { EvalCase } from '../types';
import { makeContext } from '../fixtures/properties';

export const toolsCases: EvalCase[] = [
  {
    id: 'tool-001',
    category: 'tools',
    name: 'Distance question → uses get_distance, does NOT guess',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here are some options for you. The first is at 1420 Terry Ave in Capitol Hill.' },
        { role: 'user', content: 'How far is 1420 Terry Ave from the University of Washington?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_distance' },
    ],
  },

  {
    id: 'tool-002',
    category: 'tools',
    name: 'Question about amenity → get_property_details, NOT send_properties',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'I found a nice place at 1420 Terry Ave.' },
        { role: 'user', content: 'Does 1420 Terry Ave have in-unit laundry?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_property_details' },
      { type: 'tool_not_used', tool: 'send_properties' },
    ],
  },

  {
    id: 'tool-003',
    category: 'tools',
    name: '"Show me options" + all fields → send_properties',
    context: makeContext({
      history: [
        { role: 'user', content: 'Great, show me what you have!' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'send_listing' },
      { type: 'tool_used', tool: 'send_properties' },
    ],
  },

  {
    id: 'tool-004',
    category: 'tools',
    name: 'Confirmed specific time → book_viewing',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'I have slots available on Tuesday at 2pm and 4pm. Which works for you?' },
        { role: 'user', content: 'Tuesday at 2pm works great for 1420 Terry Ave.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'book_viewing' },
    ],
  },

  {
    id: 'tool-005',
    category: 'tools',
    name: '"When can I see it?" → check_availability',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here is 1420 Terry Ave — a great 2-bed in Capitol Hill.' },
        { role: 'user', content: 'I like it! When can I see it?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'check_availability' },
    ],
  },

  {
    id: 'tool-006',
    category: 'tools',
    name: 'Client provides new info → update_client_profile alongside reply',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'How many people will be living in the apartment?' },
        { role: 'user', content: 'Just me and my wife, so 2 people. We also have a small dog, about 15 lbs.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
    ],
  },

  {
    id: 'tool-007',
    category: 'tools',
    name: '"Reschedule my viewing" → request_human_action, NOT escalate',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Your viewing is booked for Tuesday at 2pm at 1420 Terry Ave.' },
        { role: 'user', content: 'Can you reschedule my viewing to Thursday instead?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'request_human_action' },
      { type: 'tool_not_used', tool: 'escalate_to_human' },
      { type: 'action_not_equals', value: 'escalate' },
    ],
  },

  {
    id: 'tool-008',
    category: 'tools',
    name: '"Send me photos" → send_properties with photo_mode=true',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Option 1 is at 1420 Terry Ave — a 2-bed in Capitol Hill for $2,200/mo.' },
        { role: 'user', content: 'Can you send me more photos of option 1?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'send_properties' },
      { type: 'photo_mode_equals', value: true },
    ],
  },

  // ─── NEW: Expanded Tool Cases ─────────────────────────────────────────────────

  {
    id: 'tool-009',
    category: 'tools',
    name: 'Compare two properties → get_property_details for both',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'I found 1420 Terry Ave ($2,200) and 742 Bellevue Way ($2,800).' },
        { role: 'user', content: 'Can you compare those two for me? What are the differences?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 3000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_property_details' },
      { type: 'response_min_length', value: 100 },
    ],
  },

  {
    id: 'tool-010',
    category: 'tools',
    name: 'Pet policy question: "40lb dog at no-pets building" → honest no',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here is 3205 Eastlake Ave E — a 1-bed for $1,800/mo.' },
        { role: 'user', content: 'Can I bring my 40 pound dog there?' },
      ],
      knownFields: {
        bedrooms: 1, budget_max: 2000, move_in_date: '2026-04-01',
        occupants: 1, has_pets: true, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'honest_no_pets', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('no pet') || lower.includes('no-pet') || lower.includes('not allow')
          || lower.includes("doesn't allow") || lower.includes('does not allow')
          || lower.includes('unfortunately') || lower.includes('not permitted')
          || lower.includes("wouldn't be suitable") || lower.includes('not suitable')
          || lower.includes('strict') || lower.includes('not pet-friendly')
          || lower.includes('cannot bring') || lower.includes("can't bring");
      }, message: 'Should honestly say pets are not allowed at 3205 Eastlake' },
    ],
  },

  {
    id: 'tool-011',
    category: 'tools',
    name: 'Parking question for no-parking property → honest answer',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here is 505 Olive Way — a downtown studio for $1,500/mo.' },
        { role: 'user', content: 'Is there parking available at 505 Olive Way?' },
      ],
      knownFields: {
        bedrooms: 0, budget_max: 1800, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_property_details' },
      { type: 'custom', name: 'honest_no_parking', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('no parking') || lower.includes('not include parking')
          || lower.includes('does not have parking') || lower.includes("doesn't have parking")
          || lower.includes('not available') || lower.includes('street parking') || lower.includes('none');
      }, message: 'Should say 505 Olive Way has no parking' },
    ],
  },

  {
    id: 'tool-012',
    category: 'tools',
    name: 'Distance to workplace: "How far from Amazon HQ?" → get_distance',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here is 742 Bellevue Way NE — a luxury 2-bed for $2,800/mo.' },
        { role: 'user', content: 'How far is it from Amazon headquarters?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 3000, move_in_date: '2026-03-15',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_distance' },
      { type: 'response_min_length', value: 30 },
    ],
  },

  {
    id: 'tool-013',
    category: 'tools',
    name: 'Update + show in one message: "budget is $3000, show me options"',
    context: makeContext({
      history: [
        { role: 'user', content: 'My budget changed to $3000. Can you show me what you have now?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'tool_used', tool: 'send_properties' },
    ],
  },

  {
    id: 'tool-014',
    category: 'tools',
    name: '"Send me an email with details" → request_human_action (no email tool)',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here are 3 great options for you.' },
        { role: 'user', content: 'Can you email me a summary of these options? My email is john@example.com' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'handles_email_request', fn: (r) => {
        return r.toolsUsed.includes('request_human_action') || r.toolsUsed.includes('escalate_to_human')
          || r.responseText.toLowerCase().includes('agent') || r.responseText.toLowerCase().includes('send');
      }, message: 'Should handle email request (escalate or acknowledge)' },
    ],
  },

  {
    id: 'tool-015',
    category: 'tools',
    name: 'Book viewing on past date "last Tuesday" → does NOT book, clarifies',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Would you like to schedule a viewing for 1420 Terry Ave?' },
        { role: 'user', content: 'Yes, book me for last Tuesday at 2pm.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_not_equals', value: 'book_calendar' },
      { type: 'custom', name: 'clarifies_date', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('past') || lower.includes('already passed') || lower.includes('future')
          || lower.includes('upcoming') || lower.includes('did you mean') || lower.includes('next');
      }, message: 'Should clarify that the date is in the past' },
    ],
  },

  {
    id: 'tool-016',
    category: 'tools',
    name: 'Book viewing at 3am → suggests alternative within business hours',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'When would you like to see 1420 Terry Ave?' },
        { role: 'user', content: 'How about tomorrow at 3am?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'suggests_business_hours', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('hour') || lower.includes('am') || lower.includes('pm')
          || lower.includes('morning') || lower.includes('afternoon') || lower.includes('available')
          || lower.includes('10') || lower.includes('between');
      }, message: 'Should suggest alternative time within viewing hours' },
    ],
  },

  {
    id: 'tool-017',
    category: 'tools',
    name: '"Can you call me?" → request_human_action, does NOT call',
    context: makeContext({
      history: [
        { role: 'user', content: 'Can someone call me at 555-123-4567? I have questions about the lease.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'defers_to_human', fn: (r) => {
        return r.toolsUsed.includes('request_human_action') || r.toolsUsed.includes('escalate_to_human')
          || r.responseText.toLowerCase().includes('agent') || r.responseText.toLowerCase().includes('call you');
      }, message: 'Should defer call request to human agent' },
    ],
  },

  {
    id: 'tool-018',
    category: 'tools',
    name: '"Send me the lease agreement" → request_human_action',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Your viewing for 1420 Terry Ave is confirmed for Tuesday at 2pm.' },
        { role: 'user', content: 'Great, can you send me the lease agreement to review beforehand?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'defers_lease_docs', fn: (r) => {
        return r.toolsUsed.includes('request_human_action') || r.toolsUsed.includes('escalate_to_human')
          || r.responseText.toLowerCase().includes('agent') || r.responseText.toLowerCase().includes('landlord')
          || r.responseText.toLowerCase().includes('property manager');
      }, message: 'Should defer lease document request to human' },
    ],
  },

  {
    id: 'tool-019',
    category: 'tools',
    name: 'Book viewing without specifying property → asks which one',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here are your options: 1420 Terry Ave ($2,200) and 742 Bellevue Way ($2,800).' },
        { role: 'user', content: 'I want to schedule a viewing.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 3000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_not_equals', value: 'book_calendar' },
      { type: 'custom', name: 'asks_which_property', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('which') || lower.includes('1420') || lower.includes('742')
          || lower.includes('both') || lower.includes('property') || lower.includes('one');
      }, message: 'Should ask which property to schedule viewing for' },
    ],
  },

  {
    id: 'tool-020',
    category: 'tools',
    name: 'Utilities question → get_property_details, answers from data',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here is 1420 Terry Ave — a 2-bed for $2,200/mo.' },
        { role: 'user', content: 'What utilities are included in the rent?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_property_details' },
      { type: 'custom', name: 'mentions_utilities', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('water') || lower.includes('trash') || lower.includes('utilit');
      }, message: 'Should mention specific utilities from property data' },
    ],
  },
];
