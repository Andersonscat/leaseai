import type { EvalCase } from '../types';
import { makeContext } from '../fixtures/properties';

export const regressionCases: EvalCase[] = [
  {
    id: 'reg-001',
    category: 'regression',
    name: 'Bug: "12 months" → extracts lease_duration AND replies with text',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'What lease duration works for you?' },
        { role: 'user', content: '12 months' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 20 },
      { type: 'custom', name: 'has_meaningful_reply', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('12') || lower.includes('month') || lower.includes('lease')
          || lower.includes('noted') || lower.includes('great') || lower.includes('perfect')
          || lower.includes('thank');
      }, message: 'Should have a meaningful reply, not just update silently' },
    ],
  },

  {
    id: 'reg-002',
    category: 'regression',
    name: 'Bug: response is NEVER empty',
    context: makeContext({
      history: [
        { role: 'user', content: 'yes' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_min_length', value: 10 },
      { type: 'custom', name: 'not_just_whitespace', fn: (r) => {
        return r.responseText.trim().length > 5;
      }, message: 'Response should not be empty or just whitespace' },
    ],
  },

  {
    id: 'reg-003',
    category: 'regression',
    name: 'Bug: address "19128 112th Ave NE" is NOT redacted as phone',
    context: makeContext({
      properties: [
        {
          id: 'prop-pii-test',
          address: '19128 112th Ave NE, Bothell, WA 98011',
          price: '2400',
          price_monthly: 2400,
          bedrooms: 3,
          beds: 3,
          baths: 2,
          bathrooms: 2,
          sqft: 1200,
          status: 'Active',
          type: 'apartment',
          city: 'Bothell',
          state: 'WA',
          available_from: '2026-03-01',
          amenities: ['in_unit_laundry', 'dishwasher', 'patio'],
          description: 'Spacious 3-bed apartment in Bothell.',
        } as any,
      ],
      history: [
        { role: 'user', content: 'Tell me about the apartment at 19128 112th Ave NE in Bothell.' },
      ],
      knownFields: {
        bedrooms: 3, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_not_contains', value: '[phone redacted]' },
      { type: 'response_not_contains', value: '[email redacted]' },
      { type: 'custom', name: 'address_intact', fn: (r) => {
        const text = r.responseText;
        return text.includes('112th') || text.includes('19128') || text.includes('Bothell');
      }, message: 'Address should not be mangled by PII sanitization' },
    ],
  },

  {
    id: 'reg-004',
    category: 'regression',
    name: 'Bug: tool loop does NOT hang (reply_to_client always called)',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, looking for a 2-bed apartment, budget $2000, just me, no pets, 12 months, moving March 1st.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'reply_to_client' },
      { type: 'response_min_length', value: 30 },
      { type: 'custom', name: 'responds_within_toolcalls', fn: (r) => {
        return r.toolsUsed.length <= 6;
      }, message: 'Should complete within a reasonable number of tool calls (no infinite loop)' },
    ],
  },

  {
    id: 'reg-005',
    category: 'regression',
    name: 'Bug: update_client_profile always paired with reply_to_client',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'How many bedrooms do you need?' },
        { role: 'user', content: '3 bedrooms, and we have 2 cats.' },
      ],
      knownFields: {
        budget_max: 2500, property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'tool_used', tool: 'reply_to_client' },
      { type: 'response_min_length', value: 20 },
    ],
  },
];
