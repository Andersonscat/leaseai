import type { EvalCase } from '../types';
import { makeContext } from '../fixtures/properties';

export const multiTurnCases: EvalCase[] = [
  // ─── Medium (8-12 messages) ─────────────────────────────────────────────────

  {
    id: 'multi-001',
    category: 'multi-turn',
    name: 'Full qualification cycle: 8 msgs from "Hi" to gathering all fields',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, I am looking for an apartment in Seattle.' },
        { role: 'assistant', content: "I'm an AI leasing assistant for Thompson Realty. I'd be happy to help! What's your monthly budget?" },
        { role: 'user', content: 'Around $2000 per month.' },
        { role: 'assistant', content: 'Great, $2,000 noted. How many bedrooms do you need?' },
        { role: 'user', content: '2 bedrooms please.' },
        { role: 'assistant', content: 'Perfect. When are you looking to move in, and what lease duration works for you?' },
        { role: 'user', content: 'Moving March 1st, 12 month lease.' },
        { role: 'assistant', content: 'Got it. How many people will be living there, and do you have any pets?' },
        { role: 'user', content: 'Just me, no pets.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'send_properties' },
      { type: 'action_equals', value: 'send_listing' },
      { type: 'no_hallucinated_addresses' },
      { type: 'response_not_contains', value: 'What is your budget' },
      { type: 'response_not_contains', value: 'How many bedrooms' },
    ],
  },

  {
    id: 'multi-002',
    category: 'multi-turn',
    name: 'Qualification → listing → detail question (10 msgs)',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, I need a 2-bed apartment, $2500 budget, moving March 1st, 12-month lease, just me, no pets.' },
        { role: 'assistant', content: "Great! I've found some options for you. Here are the top picks: 1420 Terry Ave ($2,200) and 742 Bellevue Way ($2,800)." },
        { role: 'user', content: 'Tell me more about 1420 Terry Ave.' },
        { role: 'assistant', content: "1420 Terry Ave is a modern 2-bed in Capitol Hill. In-unit laundry, gym, rooftop deck. Cats only for pets. $2,200/mo." },
        { role: 'user', content: 'What about parking?' },
        { role: 'assistant', content: 'Garage parking is available at $150/mo.' },
        { role: 'user', content: 'And how far is it from downtown Seattle?' },
        { role: 'assistant', content: "It's right in Capitol Hill, about 1.5 miles from downtown." },
        { role: 'user', content: 'Is the security deposit the same as one month rent?' },
        { role: 'assistant', content: 'Yes, the security deposit is $2,200, equal to one month of rent.' },
        { role: 'user', content: 'Great, I would like to schedule a viewing. How about next Tuesday at 2pm?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'books_or_checks_availability', fn: (r) => {
        return r.toolsUsed.includes('book_viewing') || r.toolsUsed.includes('check_availability');
      }, message: 'Should book viewing or check availability for the requested time' },
      { type: 'response_not_contains', value: "I'm an AI" },
    ],
  },

  {
    id: 'multi-003',
    category: 'multi-turn',
    name: 'Mid-conversation budget change → updates and shows new options (10 msgs)',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, budget $2000, 2 beds, just me, no pets, 12 month lease, moving March.' },
        { role: 'assistant', content: "Here's what I found: 1420 Terry Ave at $2,200/mo is a great option close to your budget." },
        { role: 'user', content: "That's a bit over my budget..." },
        { role: 'assistant', content: "I understand. The closest within $2,000 would be a 1-bedroom option. Would you like to see those?" },
        { role: 'user', content: 'Actually, I just got a raise! My new budget is $3000.' },
        { role: 'assistant', content: "Congratulations! With $3,000 you'll have more options. Let me update your profile." },
        { role: 'user', content: 'Yes please, show me what I can get now.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 3000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'send_properties' },
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'no_hallucinated_addresses' },
    ],
  },

  {
    id: 'multi-004',
    category: 'multi-turn',
    name: 'Client asks 5 questions about different properties → no confusion (12 msgs)',
    context: makeContext({
      history: [
        { role: 'assistant', content: 'Here are your options: 1420 Terry Ave ($2,200), 742 Bellevue Way ($2,800), 3205 Eastlake Ave ($1,800).' },
        { role: 'user', content: 'Does 1420 Terry Ave allow dogs?' },
        { role: 'assistant', content: '1420 Terry Ave only allows cats, not dogs.' },
        { role: 'user', content: 'What about 742 Bellevue Way?' },
        { role: 'assistant', content: '742 Bellevue Way welcomes both dogs and cats with no weight limit.' },
        { role: 'user', content: 'Does 3205 Eastlake have parking?' },
        { role: 'assistant', content: '3205 Eastlake Ave E has street parking only, no garage.' },
        { role: 'user', content: 'And what about laundry at 742 Bellevue Way?' },
        { role: 'assistant', content: '742 Bellevue Way has in-unit laundry.' },
        { role: 'user', content: 'How far is 742 Bellevue Way from Seattle downtown?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 3000, move_in_date: '2026-03-01',
        occupants: 1, has_pets: true, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'get_distance' },
      { type: 'custom', name: 'about_bellevue_not_terry', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('bellevue') || lower.includes('742');
      }, message: 'Should answer about 742 Bellevue Way (the last question), not another property' },
    ],
  },

  // ─── Long (16-22 messages) ──────────────────────────────────────────────────

  {
    id: 'multi-005',
    category: 'multi-turn',
    name: 'Full lifecycle 20-msg: qualify → list → details → distance → book → thank (last msg)',
    context: makeContext({
      summary: `Client: David Chen, software engineer.
Budget: $2,500/mo, 2 bedrooms, moving March 1st, 12-month lease, 1 person, no pets.
Property type: rent. Preferred area: Seattle.
Shown listings: 1420 Terry Ave ($2,200), 3205 Eastlake Ave ($1,800).
Client interested in 1420 Terry Ave, asked about amenities (gym, rooftop deck, in-unit laundry).
Client asked about distance to Amazon HQ — 1.2 miles.
Client asked about parking — $150/mo garage available.`,
      history: [
        { role: 'user', content: 'So the total would be $2,200 + $150 parking = $2,350. That works.' },
        { role: 'assistant', content: "Yes exactly, $2,350/mo total. Would you like to schedule a viewing?" },
        { role: 'user', content: 'Yes, when is it available?' },
        { role: 'assistant', content: 'I have slots on Monday at 10am, Tuesday at 2pm, and Wednesday at 4pm.' },
        { role: 'user', content: 'Tuesday at 2pm works.' },
        { role: 'assistant', content: 'Your viewing for 1420 Terry Ave is confirmed for Tuesday at 2pm.' },
        { role: 'user', content: 'Perfect. What should I bring to the viewing?' },
        { role: 'assistant', content: "Just bring a valid photo ID. If you'd like to apply on the spot, a recent pay stub and references are helpful." },
        { role: 'user', content: "What's the application fee?" },
        { role: 'assistant', content: "The application fee for 1420 Terry Ave is $50." },
        { role: 'user', content: 'OK sounds good. One more thing — is the security deposit refundable?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_min_length', value: 30 },
      { type: 'response_not_contains', value: "I'm an AI" },
      { type: 'response_not_contains', value: 'How many bedrooms' },
      { type: 'response_not_contains', value: 'budget' },
      { type: 'custom', name: 'answers_deposit_question', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('deposit') || lower.includes('refund') || lower.includes('security')
          || lower.includes('landlord') || lower.includes('lease');
      }, message: 'Should answer the deposit refund question' },
    ],
  },

  {
    id: 'multi-006',
    category: 'multi-turn',
    name: 'Difficult client: starts ok → gets frustrated → calms down → books (18 msgs)',
    context: makeContext({
      summary: `Client: Sarah, budget $1,500, 1-bed, no pets, 1 person, 12-month lease, renting.
Shown 3205 Eastlake Ave ($1,800) and 505 Olive Way ($1,500).
Client frustrated that nothing is under $1,500 for a 1-bed (only studio at that price).
Client got upset about Seattle prices, called them "insane".
AI stayed professional, acknowledged frustration, explained market conditions.`,
      history: [
        { role: 'user', content: "Fine. I guess I'll look at the studio then. $1,500 for a STUDIO though..." },
        { role: 'assistant', content: "I understand your frustration with the prices. 505 Olive Way is well-located downtown near Westlake Station, which saves on commute costs. Would you like to know more about it?" },
        { role: 'user', content: "Yeah whatever, tell me about it." },
        { role: 'assistant', content: "505 Olive Way is a studio, 420 sqft, $1,500/mo. It has a gym and rooftop deck. Small pets under 25 lbs are allowed. No parking. The application fee is $35." },
        { role: 'user', content: "420 sqft?! That's tiny. But I guess it'll have to do. Does it at least have good light?" },
        { role: 'assistant', content: "The listing describes it as well-designed for urban living. I'd recommend seeing it in person to check the natural light situation. Would you like to schedule a viewing?" },
        { role: 'user', content: "OK fine. When can I see it?" },
      ],
      knownFields: {
        bedrooms: 0, budget_max: 1500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'check_availability' },
      { type: 'custom', name: 'professional_tone', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('calm down') && !lower.includes('relax')
          && !lower.includes('attitude') && !lower.includes('rude');
      }, message: 'Should remain professional despite frustrated client' },
    ],
  },

  {
    id: 'multi-007',
    category: 'multi-turn',
    name: 'Maximalist client: wants everything, nothing matches 100% (16 msgs)',
    context: makeContext({
      summary: `Client: Alex, budget $2,000/mo, 2-bed, 1 person, no pets, 12-month lease, renting.
Wants: pool, gym, in-unit laundry, parking, balcony, pet-friendly, near downtown Seattle, under $2,000.
No single property in our inventory has ALL of these at that price.
742 Bellevue Way has most amenities but is $2,800 and in Bellevue.
1420 Terry Ave has gym + laundry but no pool/balcony and is $2,200.`,
      history: [
        { role: 'user', content: "So nothing has everything I want for under $2000?" },
        { role: 'assistant', content: "At $2,000, it's tough to get all those amenities in Seattle. The closest match is 1420 Terry Ave at $2,200 — it has gym, in-unit laundry, rooftop deck, and is in Capitol Hill. It's missing pool and balcony though." },
        { role: 'user', content: "What if I stretch my budget to $2,500?" },
        { role: 'assistant', content: "At $2,500, 1420 Terry Ave ($2,200) becomes comfortably within budget. You'd still be missing a pool there. For that, you'd need 742 Bellevue Way ($2,800) which has pool, gym, laundry, balcony, and parking — but it's in Bellevue." },
        { role: 'user', content: "Which one would you recommend?" },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_min_length', value: 50 },
      { type: 'custom', name: 'balanced_recommendation', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        const mentionsBoth = (lower.includes('1420') || lower.includes('terry'))
          && (lower.includes('742') || lower.includes('bellevue'));
        const mentionsTradeoff = lower.includes('however') || lower.includes('but') || lower.includes('trade')
          || lower.includes('depend') || lower.includes('priorit') || lower.includes('on the other hand');
        return mentionsBoth || mentionsTradeoff;
      }, message: 'Should provide balanced comparison, not a one-sided push' },
    ],
  },

  {
    id: 'multi-008',
    category: 'multi-turn',
    name: 'Summary-reliant: client references detail only in summary (20 msgs)',
    context: makeContext({
      summary: `Client: Emily, budget $2,500/mo, 2-bed, no pets, 2 people (couple), 12-month lease.
Moving from San Francisco. Works remotely.
Prefers: quiet neighborhood, good coffee shops nearby, walkable.
Shown: 1420 Terry Ave (Capitol Hill) — client loved it, said "Capitol Hill sounds perfect for us".
Also shown: 3205 Eastlake Ave — client said "too far from restaurants".
Client's spouse (Tom) has a cat but Emily said "we might leave the cat with my mom".`,
      history: [
        { role: 'user', content: "We decided to keep the cat. Does 1420 Terry Ave allow cats?" },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 2, has_pets: true, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'custom', name: 'answers_cat_question', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('cat') && (lower.includes('allow') || lower.includes('yes')
          || lower.includes('welcome') || lower.includes('policy') || lower.includes('$50'));
      }, message: 'Should answer the cat policy question for 1420 Terry Ave' },
    ],
  },

  {
    id: 'multi-009',
    category: 'multi-turn',
    name: 'Bilingual client: starts EN, switches to RU at msg 8 (16 msgs)',
    context: makeContext({
      summary: `Client: Andrei, budget $2,500, 2-bed, no pets, 1 person, 12-month lease.
Previous conversation was in English.
Client was shown 1420 Terry Ave and 742 Bellevue Way.
Interested in 1420 Terry Ave.`,
      history: [
        { role: 'user', content: 'How far is 1420 Terry Ave from UW campus?' },
        { role: 'assistant', content: "1420 Terry Ave is about 3.3 miles from the University of Washington." },
        { role: 'user', content: 'That is manageable. What about groceries nearby?' },
        { role: 'assistant', content: "Capitol Hill has several grocery options within walking distance, including Trader Joe's and QFC." },
        { role: 'user', content: 'Отлично. Давай на русском теперь. Когда можно посмотреть 1420 Terry Ave?' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_language', value: 'ru' },
      { type: 'custom', name: 'answers_viewing_question', fn: (r) => {
        return r.toolsUsed.includes('check_availability') || r.responseText.toLowerCase().includes('просмотр')
          || r.responseText.toLowerCase().includes('посмотр') || r.responseText.toLowerCase().includes('доступ');
      }, message: 'Should answer about viewing availability in Russian' },
    ],
  },

  {
    id: 'multi-010',
    category: 'multi-turn',
    name: 'Slow client: answers one field at a time, sometimes off-topic (14 msgs)',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: "Hello! I'm an AI leasing assistant for Thompson Realty. How can I help you today?" },
        { role: 'user', content: 'apartment' },
        { role: 'assistant', content: "I'd be happy to help you find an apartment! What's your monthly budget?" },
        { role: 'user', content: 'ok' },
        { role: 'assistant', content: 'Could you let me know your budget range? For example, $1,500, $2,000, $2,500 per month?' },
        { role: 'user', content: '2000' },
        { role: 'assistant', content: 'Great, $2,000 noted. How many bedrooms do you need?' },
        { role: 'user', content: 'when is it available' },
        { role: 'assistant', content: "I'll be able to check availability once I know your preferences. How many bedrooms would you like?" },
        { role: 'user', content: '2' },
        { role: 'assistant', content: 'Perfect, 2 bedrooms. When are you looking to move in, and what lease duration works for you?' },
        { role: 'user', content: 'march' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2000, property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'action_equals', value: 'reply' },
      { type: 'custom', name: 'patient_tone', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return !lower.includes('please provide') && !lower.includes('i need you to')
          && !lower.includes('you must') && !lower.includes('required');
      }, message: 'Should maintain patient, friendly tone with slow client' },
    ],
  },
];
