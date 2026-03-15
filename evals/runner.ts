import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { runAgentPipeline } from '@/lib/ai/agent';
import { runAssertion } from './assertions';
import { qualificationCases } from './cases/qualification';
import { toolsCases } from './cases/tools';
import { guardrailsCases } from './cases/guardrails';
import { languageCases } from './cases/language';
import { edgeCases } from './cases/edge-cases';
import { multiTurnCases } from './cases/multi-turn';
import { adversarialCases } from './cases/adversarial';
import { regressionCases } from './cases/regression';
import type { EvalCase, EvalCaseResult, EvalReport } from './types';

// ─── Collect All Cases ───────────────────────────────────────────────────────

const ALL_CASES: EvalCase[] = [
  ...qualificationCases,
  ...toolsCases,
  ...guardrailsCases,
  ...languageCases,
  ...edgeCases,
  ...multiTurnCases,
  ...adversarialCases,
  ...regressionCases,
];

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const categoryFilter = getArg('--category');
const idFilter = getArg('--id');
const verbose = args.includes('--verbose');
const saveReport = !args.includes('--no-save');

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : undefined;
}

// ─── Filter Cases ────────────────────────────────────────────────────────────

let cases = ALL_CASES;
if (categoryFilter) {
  cases = cases.filter(c => c.category === categoryFilter);
}
if (idFilter) {
  cases = cases.filter(c => c.id === idFilter);
}

if (cases.length === 0) {
  console.error('❌ No cases matched filters.');
  console.log(`Available categories: ${Array.from(new Set(ALL_CASES.map(c => c.category))).join(', ')}`);
  console.log(`Available IDs: ${ALL_CASES.map(c => c.id).join(', ')}`);
  process.exit(1);
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function runEval(evalCase: EvalCase): Promise<EvalCaseResult> {
  const start = Date.now();

  try {
    const agentResult = await runAgentPipeline(evalCase.context);
    const latencyMs = Date.now() - start;

    const assertionResults = evalCase.assertions.map(a => runAssertion(a, agentResult));
    const passed = assertionResults.every(a => a.passed);

    return {
      caseId: evalCase.id,
      caseName: evalCase.name,
      category: evalCase.category,
      passed,
      assertions: assertionResults,
      agentResult,
      latencyMs,
    };
  } catch (err: any) {
    return {
      caseId: evalCase.id,
      caseName: evalCase.name,
      category: evalCase.category,
      passed: false,
      assertions: [],
      agentResult: {
        responseText: '',
        action: 'reply',
        extractedData: null,
        listingAddresses: [],
        photoMode: false,
        actionParams: null,
        escalationReason: null,
        humanActionRequests: [],
        toolsUsed: [],
        thoughtProcess: '',
      },
      latencyMs: Date.now() - start,
      error: err.message || String(err),
    };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧪 Running ${cases.length} eval cases...\n`);
  console.log('─'.repeat(80));

  const results: EvalCaseResult[] = [];
  const totalStart = Date.now();

  for (let i = 0; i < cases.length; i++) {
    const evalCase = cases[i];
    process.stdout.write(`  [${i + 1}/${cases.length}] ${evalCase.id}: ${evalCase.name}... `);

    const result = await runEval(evalCase);
    results.push(result);

    if (result.error) {
      console.log(`💥 ERROR (${result.latencyMs}ms)`);
      console.log(`      ${result.error}`);
    } else if (result.passed) {
      const assertCount = result.assertions.length;
      console.log(`✅ PASS [${assertCount}/${assertCount}] (${result.latencyMs}ms)`);
    } else {
      const passedCount = result.assertions.filter(a => a.passed).length;
      const totalCount = result.assertions.length;
      console.log(`❌ FAIL [${passedCount}/${totalCount}] (${result.latencyMs}ms)`);

      for (const a of result.assertions.filter(a => !a.passed)) {
        console.log(`      ↳ FAIL: ${a.message}`);
        if (verbose && a.actual !== undefined) {
          console.log(`        actual: ${JSON.stringify(a.actual).slice(0, 200)}`);
        }
      }
    }

    if (verbose && !result.error) {
      console.log(`      action: ${result.agentResult.action}`);
      console.log(`      tools: [${result.agentResult.toolsUsed.join(', ')}]`);
      console.log(`      response: "${result.agentResult.responseText.slice(0, 150)}..."`);
    }

    // Rate limit: wait between calls to avoid Gemini 429
    if (i < cases.length - 1) {
      await sleep(1500);
    }
  }

  const totalLatencyMs = Date.now() - totalStart;

  // ─── Report ──────────────────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const passRate = cases.length > 0 ? Math.round((passed / cases.length) * 1000) / 10 : 0;

  const byCategory: Record<string, { total: number; passed: number; failed: number }> = {};
  for (const r of results) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { total: 0, passed: 0, failed: 0 };
    }
    byCategory[r.category].total++;
    if (r.passed) byCategory[r.category].passed++;
    else byCategory[r.category].failed++;
  }

  console.log(`\n  📊 RESULTS: ${passed}/${cases.length} passed (${passRate}%)\n`);

  for (const [cat, stats] of Object.entries(byCategory)) {
    const catRate = Math.round((stats.passed / stats.total) * 100);
    const bar = '█'.repeat(Math.round(catRate / 5)) + '░'.repeat(20 - Math.round(catRate / 5));
    console.log(`  ${cat.padEnd(16)} ${bar} ${stats.passed}/${stats.total} (${catRate}%)`);
  }

  console.log(`\n  ⏱  Total time: ${(totalLatencyMs / 1000).toFixed(1)}s`);
  console.log(`  ⚡ Avg latency: ${Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length)}ms per case`);

  if (failed > 0) {
    console.log(`\n  ❌ Failed cases:`);
    for (const r of results.filter(r => !r.passed)) {
      console.log(`     - ${r.caseId}: ${r.caseName}${r.error ? ` (ERROR: ${r.error})` : ''}`);
    }
  }

  console.log('\n' + '═'.repeat(80) + '\n');

  // ─── Save Report ─────────────────────────────────────────────────────────

  if (saveReport) {
    const report: EvalReport = {
      timestamp: new Date().toISOString(),
      totalCases: cases.length,
      passed,
      failed,
      passRate,
      byCategory,
      results: results.map(r => ({
        ...r,
        agentResult: {
          ...r.agentResult,
          responseText: r.agentResult.responseText.slice(0, 500),
        },
      })),
      totalLatencyMs,
    };

    const reportsDir = path.join(__dirname, '..', 'evals', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `eval-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`  📄 Report saved: ${filepath}\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
