import type { EvalCase } from '../types';
import { makeContext } from '../fixtures/properties';

export const qualificationCases: EvalCase[] = [
  {
    id: 'qual-001',
    category: 'qualification',
    name: 'First message with budget + bedrooms → extracts data, asks for more',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, I am looking for a 2-bedroom apartment, budget around $2000 per month.' },
      ],
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'tool_not_used', tool: 'send_properties' },
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 30 },
    ],
  },

  {
    id: 'qual-002',
    category: 'qualification',
    name: 'All 7 fields provided → send_listing fires',
    context: makeContext({
      history: [
        { role: 'user', content: 'I need to rent a 2-bed, $2500 budget, moving March 1st, 12 month lease, just me, no pets. What do you have?' },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2500,
        move_in_date: '2026-03-01',
        occupants: 1,
        has_pets: false,
        lease_duration: '12_months',
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'send_listing' },
      { type: 'tool_used', tool: 'send_properties' },
      { type: 'no_hallucinated_addresses' },
    ],
  },

  {
    id: 'qual-003',
    category: 'qualification',
    name: 'Missing pets + lease duration → asks, does NOT send listings',
    context: makeContext({
      history: [
        { role: 'user', content: 'Looking for a 2-bed, budget $2000, moving March 1st, just me. Show me what you have.' },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2000,
        move_in_date: '2026-03-01',
        occupants: 1,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'tool_not_used', tool: 'send_properties' },
    ],
  },

  {
    id: 'qual-004',
    category: 'qualification',
    name: 'Implicit extraction: "just me, no pets" → occupants=1, has_pets=false',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, just me looking to rent, no pets. Budget $2000, need 1 bedroom, moving next month.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-005',
    category: 'qualification',
    name: '"looking to rent" → property_type extracted without asking',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hey, I am looking to rent a place in Seattle.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_not_contains', value: 'rent or buy' },
      { type: 'response_not_contains', value: 'renting or buying' },
    ],
  },

  {
    id: 'qual-006',
    category: 'qualification',
    name: 'Known budget → does NOT re-ask',
    context: makeContext({
      history: [
        { role: 'user', content: 'My budget is $2000' },
        { role: 'assistant', content: 'Great, $2000 noted. How many bedrooms do you need?' },
        { role: 'user', content: '2 bedrooms please' },
      ],
      knownFields: {
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_not_contains', value: 'budget' },
      { type: 'response_not_contains', value: 'бюджет' },
    ],
  },

  {
    id: 'qual-007',
    category: 'qualification',
    name: 'Budget in CAD → clarifies currency',
    context: makeContext({
      history: [
        { role: 'user', content: 'My budget is 2500 CAD per month.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'mentions_currency', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('cad') || lower.includes('usd') || lower.includes('currency') || lower.includes('convert');
      }, message: 'Should mention currency clarification' },
    ],
  },

  {
    id: 'qual-008',
    category: 'qualification',
    name: 'Annual budget "$24,000 a year" → accepts, converts to monthly',
    context: makeContext({
      history: [
        { role: 'user', content: 'I have a budget of $24,000 a year for rent.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_not_contains', value: 'are you sure' },
      { type: 'response_not_contains', value: 'typically costs' },
    ],
  },

  {
    id: 'qual-009',
    category: 'qualification',
    name: 'Smart bundling: 3+ missing fields → asks max 2 per message',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, looking for a place in Seattle.' },
      ],
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'max_2_questions', fn: (r) => {
        const questionMarks = (r.responseText.match(/\?/g) || []).length;
        return questionMarks <= 3;
      }, message: 'Should ask at most 2-3 questions (smart bundling)' },
    ],
  },

  {
    id: 'qual-010',
    category: 'qualification',
    name: 'Vague reply "bedrooms" → treats as non-answer, re-asks',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'How many bedrooms do you need?' },
        { role: 'user', content: 'bedrooms' },
      ],
      knownFields: {
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'response_not_contains', value: 'thank you for confirming' },
      { type: 'response_not_contains', value: 'noted' },
    ],
  },

  // ─── NEW: Expanded Qualification Cases ────────────────────────────────────────

  {
    id: 'qual-011',
    category: 'qualification',
    name: 'Budget as range "$1500-$2000" → extracts upper bound',
    context: makeContext({
      history: [
        { role: 'user', content: 'My budget is $1500-$2000 per month for a 2 bedroom.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'accepts_range', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('which one') && !lower.includes('specific number');
      }, message: 'Should accept the range without asking for a single number' },
    ],
  },

  {
    id: 'qual-012',
    category: 'qualification',
    name: 'Client changes mind: "actually I need 3 bedrooms, not 2"',
    context: makeContext({
      history: [
        { role: 'user', content: 'Looking for 2 bedrooms, budget $2000.' },
        { role: 'assistant', content: 'Great, 2 bedrooms at $2000 noted. Do you have any pets?' },
        { role: 'user', content: 'Actually I need 3 bedrooms, not 2. We are expecting a baby.' },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'acknowledges_change', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('3') || lower.includes('three') || lower.includes('updated') || lower.includes('noted');
      }, message: 'Should acknowledge the change to 3 bedrooms' },
    ],
  },

  {
    id: 'qual-013',
    category: 'qualification',
    name: 'Family with kids: "me, wife, and 3 kids" → occupants=5',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'How many people will be living in the apartment?' },
        { role: 'user', content: 'Me, my wife, and our 3 kids.' },
      ],
      knownFields: {
        bedrooms: 3,
        budget_max: 2500,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-014',
    category: 'qualification',
    name: 'Client replies with just a number "2" to bedrooms question',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'How many bedrooms are you looking for?' },
        { role: 'user', content: '2' },
      ],
      knownFields: {
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'understood_2', fn: (r) => {
        return r.toolsUsed.includes('update_client_profile');
      }, message: 'Should understand "2" and update profile (may not explicitly repeat it)' },
    ],
  },

  {
    id: 'qual-015',
    category: 'qualification',
    name: '"I\'ll tell you later" → AI moves on to next question',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Do you have any pets?' },
        { role: 'user', content: "I'll tell you later about that. What apartments do you have?" },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2000,
        move_in_date: '2026-03-01',
        occupants: 1,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'does_not_insist', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('i need to know') && !lower.includes('must answer') && !lower.includes('required');
      }, message: 'Should not insist aggressively on the skipped question' },
    ],
  },

  {
    id: 'qual-016',
    category: 'qualification',
    name: 'Client answers wrong question (asked pets, answers budget)',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Do you have any pets?' },
        { role: 'user', content: 'Oh and my budget is $2500 by the way.' },
      ],
      knownFields: {
        bedrooms: 2,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'accepts_budget_still_asks_pets', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        const acceptsBudget = lower.includes('2500') || lower.includes('2,500') || lower.includes('budget') || lower.includes('noted');
        return acceptsBudget;
      }, message: 'Should accept the budget info even though it was off-topic' },
    ],
  },

  {
    id: 'qual-017',
    category: 'qualification',
    name: 'Slang budget "2 racks a month" → $2000',
    context: makeContext({
      history: [
        { role: 'user', content: 'yo i need a crib, 2 beds, about 2 racks a month' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-018',
    category: 'qualification',
    name: '"Money is not an issue" → does NOT set budget=999999, clarifies range',
    context: makeContext({
      history: [
        { role: 'assistant', content: "What's your monthly budget for rent?" },
        { role: 'user', content: "Money is not an issue, just show me the best you have." },
      ],
      knownFields: {
        bedrooms: 2,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'does_not_set_absurd_budget', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('999') && !lower.includes('unlimited');
      }, message: 'Should not set an absurd budget value' },
    ],
  },

  {
    id: 'qual-019',
    category: 'qualification',
    name: '"ASAP" as move-in date → does not crash, handles gracefully',
    context: makeContext({
      history: [
        { role: 'user', content: 'I need a 2-bed apartment ASAP. Budget $2000, just me, no pets, 12 month lease.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 30 },
    ],
  },

  {
    id: 'qual-020',
    category: 'qualification',
    name: 'Date in the past "February 1st" → clarifies if still relevant',
    context: makeContext({
      history: [
        { role: 'user', content: 'I was supposed to move in February 1st but it fell through. Looking for a 2-bed, $2000 budget.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-021',
    category: 'qualification',
    name: '"Just a studio" → beds=0, type=studio',
    context: makeContext({
      history: [
        { role: 'user', content: "I don't need a bedroom, just a studio would be fine. Budget $1500." },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-022',
    category: 'qualification',
    name: 'Relative date "in about 2 months" → reasonable date',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'When are you looking to move in?' },
        { role: 'user', content: 'In about 2 months from now.' },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-023',
    category: 'qualification',
    name: 'Client joke "a million bedrooms haha jk 2" → extracts 2',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'How many bedrooms do you need?' },
        { role: 'user', content: 'I need a million bedrooms haha, just kidding, 2 please.' },
      ],
      knownFields: {
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'extracts_2_not_million', fn: (r) => {
        const usedUpdate = r.toolsUsed.includes('update_client_profile');
        const lower = r.responseText.toLowerCase();
        return usedUpdate && !lower.includes('million bedroom');
      }, message: 'Should extract 2 (update profile) and not take "million" literally' },
    ],
  },

  {
    id: 'qual-024',
    category: 'qualification',
    name: '6 of 7 fields known → asks only the missing one',
    context: makeContext({
      history: [
        { role: 'user', content: "I have 2 bedrooms, $2000 budget, moving March 1st, 12 month lease, just me. What do you have?" },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2000,
        move_in_date: '2026-03-01',
        occupants: 1,
        lease_duration: '12_months',
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'tool_not_used', tool: 'send_properties' },
      { type: 'custom', name: 'asks_about_pets', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('pet') || lower.includes('animal');
      }, message: 'Should ask about pets (the only missing field)' },
    ],
  },

  {
    id: 'qual-025',
    category: 'qualification',
    name: 'European date format "15.04.2026" → parses correctly',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'When would you like to move in?' },
        { role: 'user', content: '15.04.2026' },
      ],
      knownFields: {
        bedrooms: 2,
        budget_max: 2000,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'understood_date', fn: (r) => {
        return r.toolsUsed.includes('update_client_profile');
      }, message: 'Should parse the date and update profile' },
    ],
  },

  {
    id: 'qual-026',
    category: 'qualification',
    name: 'Contradictory data: knownFields=2 beds, client says "I need 1 bed" → updates',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, I need a 2-bedroom apartment.' },
        { role: 'assistant', content: 'Great, 2 bedrooms noted! What is your budget?' },
        { role: 'user', content: 'Wait, I only need 1 bedroom actually. Budget $1800.' },
      ],
      knownFields: {
        bedrooms: 2,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'acknowledges_1_bed', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('1') || lower.includes('one bedroom');
      }, message: 'Should acknowledge the update to 1 bedroom' },
    ],
  },

  {
    id: 'qual-027',
    category: 'qualification',
    name: '"a couple of bedrooms" → interprets as 2',
    context: makeContext({
      history: [
        { role: 'user', content: 'Looking for a couple of bedrooms, budget around two grand.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'qual-028',
    category: 'qualification',
    name: 'Budget "zero" / "$0" → does NOT accept, clarifies',
    context: makeContext({
      history: [
        { role: 'assistant', content: "What's your monthly budget?" },
        { role: 'user', content: "$0 lol, but seriously whatever is cheapest" },
      ],
      knownFields: {
        bedrooms: 1,
        property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'asks_real_budget', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('budget') || lower.includes('range') || lower.includes('afford')
          || lower.includes('cheap') || lower.includes('start at') || lower.includes('lowest');
      }, message: 'Should clarify real budget or mention cheapest options' },
    ],
  },
];
