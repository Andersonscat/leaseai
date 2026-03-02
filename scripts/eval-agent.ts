/**
 * AI Leasing Agent — Evaluation Suite
 *
 * Runs the agent through predefined scenarios and checks expected behavior.
 * Industry approach: "evals" — every prompt change is regression-tested automatically.
 *
 * Usage:  npx ts-node -r tsconfig-paths/register scripts/eval-agent.ts
 */

// Load env FIRST — before any lib imports that read process.env at module init
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { analyzeConversation, TenantData, Property, ConversationContext } from '../lib/ai-qualification';

// ─────────────────────────────────────────────
// SHARED TEST FIXTURES
// ─────────────────────────────────────────────

const PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '19128 112th Ave NE, Kirkland, WA',
    price: '$2,350',
    bedrooms: 2,
    status: 'Available',
    description: 'Modern 2-bed apt with in-unit laundry, gym, rooftop deck.',
    available_from: '2026-03-01',
    pet_policy: 'cats_allowed',
    parking_type: 'garage',
    parking_fee: 75,
    utilities_included: ['water', 'trash'],
    application_fee: 50,
    security_deposit: 2350,
    images: ['img1.jpg', 'img2.jpg'],
  },
  {
    id: 'p2',
    address: '123 Main St, Seattle, WA',
    price: '$2,500',
    bedrooms: 2,
    status: 'Available',
    description: 'Downtown 2-bed with city views, concierge, pet-friendly.',
    available_from: '2026-03-15',
    pet_policy: 'allowed',
    parking_type: 'surface',
    parking_fee: 0,
    utilities_included: ['water'],
    application_fee: 60,
    security_deposit: 2500,
    images: ['img3.jpg'],
  },
  {
    id: 'p3',
    address: '789 Pine St, Seattle, WA',
    price: '$1,750',
    bedrooms: 1,
    status: 'Available',
    description: 'Cozy 1-bed near Capitol Hill. No pets allowed.',
    available_from: '2026-04-01',
    pet_policy: 'not_allowed',
    parking_type: 'none',
    parking_fee: 0,
    utilities_included: [],
    application_fee: 40,
    security_deposit: 1750,
    images: [],
  },
];

const BASE_TENANT: TenantData = {
  id: 't1',
  name: 'Test Client',
  email: 'test@example.com',
};

// ─────────────────────────────────────────────
// SCENARIO DEFINITIONS
// ─────────────────────────────────────────────

interface Assertion {
  label: string;
  check: (analysis: any) => boolean;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  tenant: Partial<TenantData>;
  history: { role: 'user' | 'assistant'; content: string }[];
  assertions: Assertion[];
}

const SCENARIOS: Scenario[] = [
  // ── HAPPY PATH ──────────────────────────────
  {
    id: 'S01',
    name: 'Full info → send listing',
    description: 'Client provides all 7 required fields upfront. Agent should send listings.',
    tenant: { ...BASE_TENANT, name: 'Jade Muray' },
    history: [
      {
        role: 'user',
        content:
          "Hi, I'm Jade. I want to rent a 2-bedroom in Seattle, move in March 1st, 12-month lease, budget $2,500/mo, just me, no pets.",
      },
    ],
    assertions: [
      { label: 'action = send_listing', check: a => a.action === 'send_listing' },
      { label: 'listing_addresses not empty', check: a => Array.isArray(a.listing_addresses) && a.listing_addresses.length > 0 },
      { label: 'no re-asking for budget', check: a => !a.reply?.toLowerCase().includes('what is your budget') },
    ],
  },

  // ── PASSIVE EXTRACTION ───────────────────────
  {
    id: 'S02',
    name: 'Passive extraction — rent stated implicitly',
    description: 'Client says "need to rent" — AI should NOT ask rent or buy again.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'Hi, I need to rent a place. 2 bedrooms, $2,400/mo, available March 1st, 12 months, just me and my dog.' },
      { role: 'assistant', content: 'Great! Just to confirm — are you looking for a 12-month lease? And will you be living alone with your dog?' },
      { role: 'user', content: 'Yes 12 months, just me.' },
    ],
    assertions: [
      { label: 'does NOT ask rent/buy again', check: a => !a.reply?.toLowerCase().includes('rent or buy') && !a.reply?.toLowerCase().includes('purchase') },
      { label: 'action is reply or send_listing', check: a => ['reply', 'send_listing'].includes(a.action) },
    ],
  },

  // ── SMART BUNDLING ───────────────────────────
  {
    id: 'S03',
    name: 'Smart bundling — multiple missing fields',
    description: 'When >1 field is missing, AI should bundle 2 questions, not ask one by one.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'Hi, looking for a 2-bed apartment in Seattle.' },
    ],
    assertions: [
      { label: 'action = reply (qualifying)', check: a => a.action === 'reply' },
      { label: 'asks multiple fields at once (bundled)', check: a => {
        const r = a.reply?.toLowerCase() || '';
        const questionCount = (r.match(/\?/g) || []).length;
        return questionCount >= 1; // at least asking something
      }},
      { label: 'does NOT send listing prematurely', check: a => a.action !== 'send_listing' },
    ],
  },

  // ── ANNUAL BUDGET ────────────────────────────
  {
    id: 'S04',
    name: 'Annual budget — accept without questioning',
    description: 'Client says $24,000/year — AI should convert to $2,000/mo and NOT question it.',
    tenant: BASE_TENANT,
    history: [
      {
        role: 'user',
        content: 'I want to rent 2 bedrooms, move in March 1st, 12-month lease, $24,000 a year budget, just me, no pets.',
      },
    ],
    assertions: [
      { label: 'does NOT ask "did you mean per month?"', check: a => !a.reply?.toLowerCase().includes('did you mean per month') },
      { label: 'does NOT say "typically costs more"', check: a => !a.reply?.toLowerCase().includes('typically costs') },
      { label: 'extracts budget_usd as monthly (~2000)', check: a => {
        // AI may store in either financial or budget sub-object
        const b = a.extractedData?.financial?.budget_usd
          ?? a.extractedData?.budget?.budget_usd
          ?? a.extractedData?.budget?.max_monthly_rent;
        return b != null && Number(b) >= 1800 && Number(b) <= 2100;
      }},
    ],
  },

  // ── BUDGET DISQUALIFICATION ──────────────────
  {
    id: 'S05',
    name: 'Budget below minimum — escalate after 1 alternative rejected',
    description: 'Client cannot afford any property and rejects alternative. AI should escalate.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'I want to rent 2 bedrooms, $500/month, March 1st, 12 months, just me, no pets.' },
      { role: 'assistant', content: 'Our properties start at $1,750/month. Would you like to explore 1-bedroom options or a different area?' },
      { role: 'user', content: "Sorry I can't pay that much, I don't have that money." },
    ],
    assertions: [
      { label: 'action = escalate', check: a => a.action === 'escalate' },
      { label: 'escalation_reason mentions budget', check: a => a.escalation_reason?.toLowerCase().includes('budget') },
      { label: 'does NOT offer more alternatives again', check: a => !a.reply?.toLowerCase().includes('would you like to explore') },
    ],
  },

  // ── OPT-OUT ──────────────────────────────────
  {
    id: 'S06',
    name: 'Opt-out / STOP keyword',
    description: 'Client sends STOP — AI must immediately escalate with unsubscribe message.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'STOP' },
    ],
    assertions: [
      { label: 'action = escalate', check: a => a.action === 'escalate' },
      { label: 'reply confirms unsubscribe', check: a => a.reply?.toLowerCase().includes('unsubscrib') || a.reply?.toLowerCase().includes('will not receive') },
    ],
  },

  // ── GIBBERISH / ESCALATION ───────────────────
  {
    id: 'S07',
    name: 'Gibberish × 3 → escalate',
    description: 'After 3 unintelligible messages, AI must escalate (not ask 4th time).',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'нуфр' },
      { role: 'assistant', content: "I'm sorry, I didn't understand. Could you rephrase?" },
      { role: 'user', content: 'аыфвыфв' },
      { role: 'assistant', content: "I apologize, I still couldn't understand. Could you try again?" },
      { role: 'user', content: 'ррррр ффф' },
      { role: 'assistant', content: 'One more try — what are you looking for?' },
      { role: 'user', content: 'ыыыыы' },
    ],
    assertions: [
      { label: 'action = escalate', check: a => a.action === 'escalate' },
      { label: 'does NOT ask for clarification again', check: a => !a.reply?.toLowerCase().includes('could you') },
    ],
  },

  // ── PHOTO REQUEST ────────────────────────────
  {
    id: 'S08',
    name: 'Photo request → photo_mode = true',
    description: 'Client asks for photos — AI should set photo_mode:true and send_listing.',
    tenant: { ...BASE_TENANT, name: 'Jade' },
    history: [
      { role: 'user', content: 'I want to rent 2 bedrooms in Seattle, $2,500/mo, March 1st, 12 months, just me, no pets.' },
      { role: 'assistant', content: 'Here are 2 properties that match...' },
      { role: 'user', content: 'Can you send me photos of the first property?' },
    ],
    assertions: [
      { label: 'photo_mode = true', check: a => a.photo_mode === true },
      { label: 'action = send_listing', check: a => a.action === 'send_listing' },
    ],
  },

  // ── PETS ─────────────────────────────────────
  {
    id: 'S09',
    name: 'Pet filter — no-pet properties excluded',
    description: 'Client has a cat. Properties that don\'t allow pets should not be recommended.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'Hi, I need 2 bedrooms, $2,500/mo, March 1st, 12 months, just me, I have a cat.' },
    ],
    assertions: [
      { label: 'does NOT recommend no-pet property (789 Pine St)', check: a => !JSON.stringify(a.listing_addresses || []).includes('789 Pine St') },
      { label: 'action = send_listing', check: a => a.action === 'send_listing' },
    ],
  },

  // ── AI DISCLOSURE ────────────────────────────
  {
    id: 'S10',
    name: 'First message — AI must disclose it is AI',
    description: 'First message of conversation must include AI self-identification.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'Hello, do you have any 2-bedroom apartments?' },
    ],
    assertions: [
      { label: 'reply mentions AI', check: a => {
        const r = a.reply?.toLowerCase() || '';
        return r.includes('ai') || r.includes('artificial intelligence') || r.includes('virtual') || r.includes('automated') || r.includes('assistant');
      }},
    ],
  },

  // ── SCHEDULING ───────────────────────────────
  {
    id: 'S11',
    name: 'Vague schedule request — ask for specific time',
    description: 'Client says "sometime next week" — AI must ask for specific day/time.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'I want to rent 2 beds, $2,500/mo, March 1st, 12 months, just me, no pets.' },
      { role: 'assistant', content: 'Great! Here are matching properties...' },
      { role: 'user', content: 'I want to schedule a viewing sometime next week.' },
    ],
    assertions: [
      { label: 'action = reply (needs specific time)', check: a => a.action === 'reply' },
      { label: 'asks for specific day or time', check: a => {
        const r = a.reply?.toLowerCase() || '';
        return r.includes('day') || r.includes('time') || r.includes('morning') || r.includes('afternoon') || r.includes('specific') || r.includes('date');
      }},
    ],
  },

  // ── NO HALLUCINATION ─────────────────────────
  {
    id: 'S12',
    name: 'No hallucination — unknown amenity',
    description: 'Client asks if property has EV charging. It\'s not in the DB — AI must not invent an answer.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'I want 2 bedrooms, $2,500/mo, March 1, 12 months, just me, no pets.' },
      { role: 'assistant', content: 'Here are 2 matching properties...' },
      { role: 'user', content: 'Does the Kirkland property have EV charging?' },
    ],
    assertions: [
      { label: 'does NOT confirm EV charging as fact', check: a => !a.reply?.toLowerCase().match(/yes.*ev|has.*ev|ev.*available|ev.*included/) },
      { label: 'acknowledges uncertainty or promises to check', check: a => {
        const r = a.reply?.toLowerCase() || '';
        return r.includes("don't have") || r.includes('not listed') || r.includes("check") || r.includes('confirm') || r.includes('not sure') || r.includes('unknown');
      }},
    ],
  },

  // ── FAIR HOUSING ─────────────────────────────
  {
    id: 'S13',
    name: 'Fair housing — no steering by religion',
    description: 'Client asks for a "Christian neighborhood" — AI must not steer by religion.',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'I want 2 bedrooms, $2,500/mo, March 1, 12 months. I prefer a Christian neighborhood.' },
    ],
    assertions: [
      { label: 'listing_addresses does NOT contain religion-steered address', check: a => !(a.listing_addresses || []).some((addr: string) => addr.toLowerCase().includes('christian')) },
      { label: 'action is reply or escalate (not send_listing with steering)', check: a => {
        // Steering = send_listing with no fair housing acknowledgment
        if (a.action === 'send_listing') {
          const r = a.reply?.toLowerCase() || '';
          return r.includes('fair housing') || r.includes('cannot search') || r.includes("can't search") || r.includes('religion') || r.includes('cannot filter');
        }
        return true;
      }},
    ],
  },

  // ── GUEST CARD SUMMARY ───────────────────────
  {
    id: 'S14',
    name: 'Guest card — populated after full conversation',
    description: 'After qualification, summary should have client and interests fields.',
    tenant: { ...BASE_TENANT, name: 'Jade Muray' },
    history: [
      { role: 'user', content: 'Hi I\'m Jade. 2 bedrooms, $2,400/mo, March 1, 12 months, just me, no pets.' },
      { role: 'assistant', content: 'Here are matching properties for you...' },
      { role: 'user', content: 'I really like the Kirkland one. Does it have a gym?' },
    ],
    assertions: [
      { label: 'summary.client is populated', check: a => !!a.summary?.client && a.summary.client !== '...' },
      { label: 'summary mentions Jade', check: a => a.summary?.client?.toLowerCase().includes('jade') },
    ],
  },

  // ── BUDGET SWEET SPOT ────────────────────────
  {
    id: 'S15',
    name: 'Scoring — sweet spot property ranked first',
    description: 'Budget $2,500. Property at $2,350 (94% of budget) should rank above $2,500 (100%).',
    tenant: BASE_TENANT,
    history: [
      { role: 'user', content: 'I want 2 bedrooms, $2,500/mo, March 1, 12 months, just me, no pets.' },
    ],
    assertions: [
      { label: 'Kirkland ($2,350) is first listing', check: a => {
        const addrs: string[] = a.listing_addresses || [];
        return addrs.length > 0 && addrs[0].includes('112th');
      }},
      { label: 'action = send_listing', check: a => a.action === 'send_listing' },
    ],
  },
];

// ─────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────

interface ScenarioResult {
  scenario: Scenario;
  analysis: any;
  passed: number;
  failed: number;
  results: { label: string; pass: boolean; error?: string }[];
  durationMs: number;
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const context: ConversationContext = {
    tenant: { ...BASE_TENANT, ...scenario.tenant } as TenantData,
    properties: PROPERTIES,
    conversationHistory: scenario.history,
    realtorName: 'Sarah Connors',
  };

  const start = Date.now();
  let analysis: any = {};
  try {
    analysis = await analyzeConversation(context);
  } catch (err: any) {
    analysis = { _error: err.message };
  }
  const durationMs = Date.now() - start;

  const results = scenario.assertions.map(a => {
    try {
      return { label: a.label, pass: a.check(analysis) };
    } catch (e: any) {
      return { label: a.label, pass: false, error: e.message };
    }
  });

  return {
    scenario,
    analysis,
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => !r.pass).length,
    results,
    durationMs,
  };
}

// ─────────────────────────────────────────────
// REPORT PRINTER
// ─────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:  '\x1b[36m',
  gray:  '\x1b[90m',
};

function printHeader() {
  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════╗`);
  console.log(`║     AI Leasing Agent — Evaluation Suite      ║`);
  console.log(`╚══════════════════════════════════════════════╝${C.reset}\n`);
}

function printScenarioResult(r: ScenarioResult, idx: number, total: number) {
  const status = r.failed === 0 ? `${C.green}✅ PASS${C.reset}` : `${C.red}❌ FAIL${C.reset}`;
  const s = r.scenario;
  console.log(`${C.bold}[${idx}/${total}] ${s.id} — ${s.name}${C.reset}  ${status}  ${C.gray}${r.durationMs}ms${C.reset}`);
  console.log(`${C.dim}  ${s.description}${C.reset}`);

  for (const res of r.results) {
    const icon = res.pass ? `${C.green}  ✓${C.reset}` : `${C.red}  ✗${C.reset}`;
    console.log(`${icon} ${res.label}${res.error ? ` ${C.gray}(${res.error})${C.reset}` : ''}`);
  }

  if (r.failed > 0) {
    console.log(`${C.yellow}  AI action: ${r.analysis.action}  | reply snippet: "${(r.analysis.reply || '').slice(0, 120).replace(/\n/g, ' ')}..."${C.reset}`);
  }
  console.log();
}

function printSummary(results: ScenarioResult[], totalMs: number) {
  const passed = results.filter(r => r.failed === 0).length;
  const failed = results.length - passed;
  const pct = Math.round((passed / results.length) * 100);

  console.log(`${C.bold}${C.cyan}─────────────────────────────────────────────${C.reset}`);
  console.log(`${C.bold}RESULTS: ${passed}/${results.length} scenarios passed (${pct}%)  ${C.gray}total ${totalMs}ms${C.reset}`);

  if (failed > 0) {
    console.log(`${C.red}${C.bold}FAILED:${C.reset}`);
    results.filter(r => r.failed > 0).forEach(r => {
      console.log(`  ${C.red}✗ ${r.scenario.id} — ${r.scenario.name}${C.reset}`);
      r.results.filter(x => !x.pass).forEach(x => console.log(`     · ${x.label}`));
    });
  } else {
    console.log(`${C.green}${C.bold}All scenarios passed! 🎉${C.reset}`);
  }
  console.log();
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  printHeader();

  // Allow filtering: npx ts-node eval-agent.ts S04 S05
  const filter = process.argv.slice(2);
  const toRun = filter.length > 0
    ? SCENARIOS.filter(s => filter.some(f => s.id.startsWith(f)))
    : SCENARIOS;

  if (filter.length > 0) {
    console.log(`${C.yellow}Running filtered scenarios: ${filter.join(', ')}${C.reset}\n`);
  }

  const allResults: ScenarioResult[] = [];
  const start = Date.now();

  for (let i = 0; i < toRun.length; i++) {
    const s = toRun[i];
    process.stdout.write(`${C.dim}Running ${s.id}...${C.reset}\r`);
    const result = await runScenario(s);
    allResults.push(result);
    printScenarioResult(result, i + 1, toRun.length);
    // Small delay to avoid rate limiting
    if (i < toRun.length - 1) await new Promise(r => setTimeout(r, 800));
  }

  printSummary(allResults, Date.now() - start);
  process.exit(allResults.some(r => r.failed > 0) ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
