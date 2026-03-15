import type { EvalCase } from '../types';
import { makeContext } from '../fixtures/properties';

export const languageCases: EvalCase[] = [
  {
    id: 'lang-001',
    category: 'language',
    name: 'Russian message → Russian response',
    context: makeContext({
      history: [
        { role: 'user', content: 'Привет, ищу квартиру в Сиэтле. Бюджет 2000 долларов, 2 спальни.' },
      ],
    }),
    assertions: [
      { type: 'response_language', value: 'ru' },
      { type: 'tool_used', tool: 'update_client_profile' },
    ],
  },

  {
    id: 'lang-002',
    category: 'language',
    name: 'English message → English response',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi there, looking for a 2-bedroom in Seattle. Budget is around $2000.' },
      ],
    }),
    assertions: [
      { type: 'response_language', value: 'en' },
    ],
  },

  {
    id: 'lang-003',
    category: 'language',
    name: 'First message → contains AI disclosure',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hello, I am interested in renting an apartment.' },
      ],
    }),
    assertions: [
      { type: 'custom', name: 'ai_disclosure', fn: (r) => {
        const lower = r.responseText.toLowerCase();
        return lower.includes('ai') || lower.includes('assistant') || lower.includes('automated');
      }, message: 'First message should contain AI disclosure' },
    ],
  },

  {
    id: 'lang-004',
    category: 'language',
    name: 'Not first message → NO AI disclosure / re-introduction',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, looking for an apartment.' },
        { role: 'assistant', content: "Hi! I'm an AI leasing assistant for Thompson Realty. I'd be happy to help! What's your budget?" },
        { role: 'user', content: 'Budget is $2000. Need 2 bedrooms.' },
      ],
      knownFields: { property_type: 'rent' },
    }),
    assertions: [
      { type: 'response_not_contains', value: "I'm an AI" },
      { type: 'response_not_contains', value: 'AI leasing assistant' },
      { type: 'response_not_contains', value: 'I am an AI' },
    ],
  },

  // ─── NEW: Expanded Language Cases ─────────────────────────────────────────────

  {
    id: 'lang-005',
    category: 'language',
    name: 'Spanish message → Spanish response',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hola, estoy buscando un apartamento de 2 habitaciones. Mi presupuesto es de $2000 al mes.' },
      ],
    }),
    assertions: [
      { type: 'response_language', value: 'es' },
      { type: 'tool_used', tool: 'update_client_profile' },
    ],
  },

  {
    id: 'lang-006',
    category: 'language',
    name: 'Mixed RU/EN: "Привет, I need 2 bedrooms" → responds in dominant language',
    context: makeContext({
      history: [
        { role: 'user', content: 'Привет, I need 2 bedrooms, бюджет $2000 в месяц.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 30 },
    ],
  },

  {
    id: 'lang-007',
    category: 'language',
    name: 'ALL CAPS message → responds normally, does NOT mirror caps',
    context: makeContext({
      history: [
        { role: 'user', content: 'I NEED AN APARTMENT RIGHT NOW 2 BEDROOMS $2000 PER MONTH PLEASE HELP ME' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'custom', name: 'not_all_caps', fn: (r) => {
        const upper = r.responseText.replace(/[^a-zA-Z]/g, '');
        const capsRatio = (upper.match(/[A-Z]/g) || []).length / upper.length;
        return capsRatio < 0.5;
      }, message: 'Should NOT respond in all caps' },
    ],
  },

  {
    id: 'lang-008',
    category: 'language',
    name: 'Emoji-heavy message → extracts data correctly',
    context: makeContext({
      history: [
        { role: 'user', content: '👋 looking for 🏠 2🛏️ $2000💰 no 🐕 moving in March 📅' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 30 },
    ],
  },

  {
    id: 'lang-009',
    category: 'language',
    name: 'Russian full qualification → sends listings in Russian',
    context: makeContext({
      history: [
        { role: 'user', content: 'Привет! Ищу квартиру: 2 спальни, бюджет $2500, переезд 1 марта, аренда на 12 месяцев, живу один, без животных.' },
      ],
      knownFields: {
        bedrooms: 2, budget_max: 2500, move_in_date: '2026-03-01',
        occupants: 1, has_pets: false, lease_duration: '12_months', property_type: 'rent',
      },
    }),
    assertions: [
      { type: 'response_language', value: 'ru' },
      { type: 'tool_used', tool: 'send_properties' },
    ],
  },

  {
    id: 'lang-010',
    category: 'language',
    name: 'Client switches language mid-conversation → AI adapts',
    context: makeContext({
      history: [
        { role: 'user', content: 'Hi, looking for a 2-bedroom apartment.' },
        { role: 'assistant', content: "I'm an AI leasing assistant. What's your budget?" },
        { role: 'user', content: 'Бюджет 2000 долларов. Можно на русском?' },
      ],
      knownFields: { bedrooms: 2, property_type: 'rent' },
    }),
    assertions: [
      { type: 'response_language', value: 'ru' },
      { type: 'tool_used', tool: 'update_client_profile' },
    ],
  },

  {
    id: 'lang-011',
    category: 'language',
    name: 'Transliterated Russian → understands intent',
    context: makeContext({
      history: [
        { role: 'user', content: 'Privet, ischu kvartiru v Seattle, 2 komnaty, budget 2000 dollarov.' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 30 },
    ],
  },

  {
    id: 'lang-012',
    category: 'language',
    name: 'Chinese message → responds appropriately',
    context: makeContext({
      history: [
        { role: 'user', content: '你好，我想租一套两居室公寓，预算每月2000美元。' },
      ],
    }),
    assertions: [
      { type: 'tool_used', tool: 'update_client_profile' },
      { type: 'response_min_length', value: 20 },
    ],
  },
];
