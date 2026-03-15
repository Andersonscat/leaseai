import type { EvalCase } from '../types';
import { makeContext, TEST_PROPERTIES } from '../fixtures/properties';

export const edgeCases: EvalCase[] = [
  {
    id: 'edge-001',
    category: 'edge-cases',
    name: 'Empty / short history → does not crash, responds',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi' },
      ],
    }),
    assertions: [
      { type: 'response_min_length', value: 10 },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'edge-002',
    category: 'edge-cases',
    name: '0 properties available → honestly says no listings',
    context: makeContext({
      properties: [],
      history: [
        { role: 'user', content: 'What apartments do you have available? Budget $2000, 2 beds, 12 months, just me, no pets, rent, moving March.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_not_used', tool: 'send_properties' },
      { type: 'custom', name: 'honest_no_properties', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('no') || lower.includes("don't have") || lower.includes('currently')
          || lower.includes('unfortunately') || lower.includes('available');
      }, message: 'Should honestly say there are no properties' },
    ],
  },

  {
    id: 'edge-003',
    category: 'edge-cases',
    name: 'Client asks about non-existent property → does NOT invent',
    context: makeContext({
      history: [
        { role: 'user', content: 'Do you have anything at 999 Fake Street, Seattle?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'no_hallucinated_addresses_except_client', fn: (r) => {
        const addressPattern = /\b\d{1,6}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Way|Pl|Place)\b\.?/gi;
        const found = r.responseText.match(addressPattern) || [];
        const clientAddresses = ['999 fake street'];
        const knownAddresses = ['1420 terry ave', '3205 eastlake ave', '742 bellevue way', '505 olive way', '12030 ne 12th st'];
        const hallucinated = found.filter(a => {
          const n = a.toLowerCase().trim();
          return !knownAddresses.some(k => n.includes(k) || k.includes(n.split(',')[0]))
            && !clientAddresses.some(c => n.includes(c));
        });
        return hallucinated.length === 0;
      }, message: 'Should not hallucinate addresses (client-mentioned addresses excluded)' },
      { type: 'custom', name: 'does_not_confirm_fake', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('999 fake street') || lower.includes("don't have") || lower.includes('not')
          || lower.includes('no listing') || lower.includes('unfortunately') || lower.includes('not available');
      }, message: 'Should not confirm the non-existent property exists' },
    ],
  },

  {
    id: 'edge-004',
    category: 'edge-cases',
    name: 'Conversation summary present → AI references it properly',
    context: makeContext({
      summary: `**Client Profile:**
- Name: Sarah, budget $2,500/mo, 2 bedrooms, moving April 1st
- Has a small cat, 12-month lease, renting
- Prefers Seattle, must-have: in-unit laundry

**Properties Discussed:**
- 1420 Terry Ave: Client liked it, but concerned about cat policy (cats only, $50/mo extra)
- Client asked about parking — $150/mo garage

**Open Questions:**
- Client asked if pet deposit is negotiable — needs landlord confirmation`,
      history: [
        { role: 'user', content: 'Hi, any update on the pet deposit question?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-04-01',
        occupants: 1, has_pets: true, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'references_pet_context', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('pet') || lower.includes('deposit') || lower.includes('landlord')
          || lower.includes('check') || lower.includes('confirm');
      }, message: 'Should reference pet deposit from summary context' },
    ],
  },

  {
    id: 'edge-005',
    category: 'edge-cases',
    name: '"Are you a bot?" → confirms AI honestly',
    context: makeContext({
      history: [
        { role: 'user', content: 'Wait, are you a real person or a bot?' },
      ],
    }),
    assertions: [
      { type: 'custom', name: 'confirms_ai', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('ai') || lower.includes('artificial') || lower.includes('automated')
          || lower.includes('bot') || lower.includes('assistant');
      }, message: 'Should confirm being an AI' },
      { type: 'response_not_contains', value: 'I am a real person' },
      { type: 'response_not_contains', value: 'I am human' },
    ],
  },

  // ─── NEW: Expanded Edge Cases ─────────────────────────────────────────────────

  {
    id: 'edge-006',
    category: 'edge-cases',
    name: 'Very long message (500+ words backstory) → extracts key data',
    context: makeContext({
      history: [
        { role: 'user', content: `Hi there. So here's my situation — I recently went through a divorce and I've been living with my parents for the past 3 months while I get back on my feet. I used to live in a beautiful 4-bedroom house in Bellevue with my ex-wife and our two golden retrievers, but obviously that's all changed now. The dogs are staying with her, so no pets for me anymore. I work as a software engineer at Amazon in Seattle, and my commute from my parents' place in Tacoma is absolutely killing me — it's like 2 hours each way with traffic. I really need to find something closer to work. I'm thinking either Capitol Hill or somewhere near South Lake Union would be ideal. My salary is pretty good, so budget isn't a huge concern, but I'd like to keep it reasonable — maybe around $2,000 to $2,500 per month. I just need a one-bedroom or even a studio would be fine, it's just me now. I'm looking to move as soon as possible, ideally by the end of this month or early next month. I'd prefer a 12-month lease to start with, and I want something with in-unit laundry because I absolutely hate going to a laundromat. Parking would be nice too since I drive to work. Anyway, sorry for the long message, I just wanted to give you the full picture. What do you have available?` },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 50 },
      { type: 'custom', name: 'empathetic_not_clinical', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('understand') || lower.includes('help') || lower.includes('happy to')
          || lower.includes('glad') || lower.includes('sorry') || lower.includes('situation')
          || lower.includes('thank you') || lower.includes('sharing') || lower.includes('appreciate')
          || lower.includes('find') || lower.includes('option');
      }, message: 'Should be helpful/empathetic, not just clinical' },
    ],
  },

  {
    id: 'edge-007',
    category: 'edge-cases',
    name: 'Only whitespace message → handles gracefully',
    context: makeContext({
      history: [
        { role: 'user', content: '   ' },
      ],
    }),
    assertions: [
      { type: 'response_min_length', value: 10 },
    ],
  },

  {
    id: 'edge-008',
    category: 'edge-cases',
    name: 'Only URL message → does NOT navigate, asks for context',
    context: makeContext({
      history: [
        { role: 'user', content: 'https://www.zillow.com/homedetails/1420-Terry-Ave-Seattle-WA/12345_zpid/' },
      ],
      knownFields: { bedrooms: 2, budget_max: 2500, property_type: 'rent' },
    }),
    assertions: [
      { type: 'response_min_length', value: 20 },
      { type: 'custom', name: 'does_not_fabricate', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('i checked') && !lower.includes('i visited') && !lower.includes('according to the link');
      }, message: 'Should NOT claim to have visited the URL' },
    ],
  },

  {
    id: 'edge-009',
    category: 'edge-cases',
    name: 'Only emoji "👍" → contextual response',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Would you like me to show you some options?' },
        { role: 'user', content: '👍' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_min_length', value: 20 },
      { type: 'custom', name: 'treats_as_yes', fn: (r) => {
        return r.toolsUsed.includes('send_properties') || r.responseText.toLowerCase().includes('here')
          || r.responseText.toLowerCase().includes('option') || r.responseText.toLowerCase().includes('listing');
      }, message: 'Should treat 👍 as affirmative and proceed' },
    ],
  },

  {
    id: 'edge-010',
    category: 'edge-cases',
    name: 'Angry client → stays calm, professional',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'The cheapest option we have is $1,500/mo for a studio at 505 Olive Way.' },
        { role: 'user', content: "This is ridiculous! Everything is so overpriced! I can't believe these prices. Is there really nothing cheaper??" },
      ],
      knownFields: { bedrooms: 1, budget_max: 1200, property_type: 'rent' },
    }),
    assertions: [
      { type: 'response_min_length', value: 30 },
      { type: 'custom', name: 'empathetic_professional', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        const professional = lower.includes('understand') || lower.includes('appreciate')
          || lower.includes('sorry') || lower.includes('hear') || lower.includes('frustrat');
        const rude = lower.includes('calm down') || lower.includes('relax') || lower.includes('overreacting');
        return professional && !rude;
      }, message: 'Should be empathetic and professional, never condescending' },
    ],
  },

  {
    id: 'edge-011',
    category: 'edge-cases',
    name: '"Thanks, bye!" → graceful farewell, does NOT push',
    context: makeContext({
      history: [
        { role: 'assistant', content: "Here are 3 options I found for you..." },
        { role: 'user', content: "Thanks for the help! That's all I need for now. Bye!" },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'graceful_farewell', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('welcome') || lower.includes('anytime') || lower.includes('reach out')
          || lower.includes('hesitate') || lower.includes('good luck') || lower.includes('best')
          || lower.includes('happy to help') || lower.includes('take care');
      }, message: 'Should say a warm goodbye' },
      { type: 'custom', name: 'not_pushy', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('but wait') && !lower.includes('before you go')
          && !lower.includes('one more thing') && !lower.includes('you should also');
      }, message: 'Should NOT be pushy when client says goodbye' },
    ],
  },

  {
    id: 'edge-012',
    category: 'edge-cases',
    name: 'Client returns after summary: "Hi, any updates?" → uses summary context',
    context: makeContext({
      summary: `Client: Mike, budget $2,500, 2-bed, no pets, 1 person, 12-month lease.
Shown 1420 Terry Ave ($2,200) and 742 Bellevue Way ($2,800).
Client interested in 1420 Terry Ave, asked about parking ($150/mo garage).
Pending: client wanted to discuss with spouse before booking a viewing.`,
      history: [
        { role: 'user', content: 'Hi, I am back! Any new listings since last time?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'remembers_context', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('back') || lower.includes('welcome') || lower.includes('1420')
          || lower.includes('terry') || lower.includes('last time') || lower.includes('previously');
      }, message: 'Should reference previous context from summary' },
    ],
  },

  {
    id: 'edge-013',
    category: 'edge-cases',
    name: 'Client sends same question twice → does NOT glitch',
    context: makeContext({
      history: [
        { role: 'user', content: 'What apartments do you have for $2000?' },
        { role: 'assistant', content: "I'd love to help. Before showing options, let me ask: how many bedrooms do you need?" },
        { role: 'user', content: 'What apartments do you have for $2000?' },
      ],
      knownFields: { budget_max: 2000, property_type: 'rent' },
    }),
    assertions: [
      { type: 'response_min_length', value: 20 },
      { type: 'action_equals', value: 'reply' },
    ],
  },

  {
    id: 'edge-014',
    category: 'edge-cases',
    name: 'Narrow criteria → only 1 property matches, shows honestly',
    context: makeContext({
      history: [
        { role: 'user', content: "I need a 3-bedroom townhouse with a garage, pet-friendly, under $3500, 12-month lease, family of 4, we have a dog." },
      ],
      knownFields: {
        bedrooms: 3, budget_max: 3500, occupants: 4, has_pets: true,
        lease_duration: '12_months', property_type: 'rent', move_in_date: '2026-04-01',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'send_properties' },
      { type: 'no_hallucinated_addresses' },
    ],
  },

  {
    id: 'edge-015',
    category: 'edge-cases',
    name: 'Client already booked → does NOT offer to book again',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Your viewing for 1420 Terry Ave is confirmed for Tuesday at 2pm.' },
        { role: 'user', content: "Great, I'm excited! Anything I should bring?" },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'action_not_equals', value: 'book_calendar' },
      { type: 'response_min_length', value: 20 },
    ],
  },

  {
    id: 'edge-016',
    category: 'edge-cases',
    name: 'Copy-paste from another site → does NOT confuse with own listing',
    context: makeContext({
      history: [
        { role: 'user', content: "I found this on Craigslist: '2BR/1BA at 9876 Fake Blvd, Seattle. $1,800/mo. Pets OK.' Do you have anything similar?" },
      ],
      knownFields: { bedrooms: 2, budget_max: 2000, property_type: 'rent' },
    }),
    assertions: [
      { type: 'custom', name: 'does_not_claim_listing', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('9876 fake blvd') || lower.includes("don't have") || lower.includes('not in our')
          || lower.includes("isn't listed") || lower.includes('not listed') || lower.includes('not in')
          || lower.includes('similar') || lower.includes('instead') || lower.includes("can't find")
          || lower.includes('no listing') || lower.includes('not available');
      }, message: 'Should NOT claim the Craigslist listing as its own' },
    ],
  },

  {
    id: 'edge-017',
    category: 'edge-cases',
    name: 'Token stuffing: 200 words noise + actual request → extracts useful info',
    context: makeContext({
      history: [
        { role: 'user', content: `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip. Anyway I need a 2-bedroom apartment for $2000 per month.` },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 20 },
    ],
  },

  {
    id: 'edge-018',
    category: 'edge-cases',
    name: 'Very polite / grateful client → accepts gracefully, keeps helping',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here are some options for you.' },
        { role: 'user', content: "Oh my god, thank you SO much!! You are absolutely the best!! I really appreciate all your help! This is amazing service!! 😊😊😊 Can you tell me more about the first one?" },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_min_length', value: 20 },
      { type: 'custom', name: 'continues_helping', fn: (r) => {
        return r.toolsUsed.includes('get_property_details') || r.responseText.toLowerCase().includes('detail')
          || r.responseText.toLowerCase().includes('option') || r.responseText.toLowerCase().includes('1420');
      }, message: 'Should accept gratitude and continue helping with the request' },
    ],
  },

  {
    id: 'edge-019',
    category: 'edge-cases',
    name: 'Message with only numbers "2 2000 3 1" → attempts to understand',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Could you tell me your requirements? Budget, bedrooms, move-in date?' },
        { role: 'user', content: '2 2000 3 1' },
      ],
      knownFields: { property_type: 'rent' },
    }),
    assertions: [
      { type: 'response_min_length', value: 20 },
      { type: 'action_equals', value: 'reply' },
    ],
  },
];
