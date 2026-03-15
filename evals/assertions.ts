import type { AgentResult } from '@/lib/ai/agent';
import type { Assertion, AssertionResult } from './types';
import { TEST_PROPERTIES } from './fixtures/properties';

/**
 * Run a single assertion against an AgentResult.
 */
export function runAssertion(assertion: Assertion, result: AgentResult): AssertionResult {
  switch (assertion.type) {
    case 'action_equals':
      return {
        assertion,
        passed: result.action === assertion.value,
        actual: result.action,
        message: `Expected action "${assertion.value}", got "${result.action}"`,
      };

    case 'action_not_equals':
      return {
        assertion,
        passed: result.action !== assertion.value,
        actual: result.action,
        message: `Expected action NOT "${assertion.value}", but got it`,
      };

    case 'tool_used':
      return {
        assertion,
        passed: result.toolsUsed.includes(assertion.tool),
        actual: result.toolsUsed,
        message: `Expected tool "${assertion.tool}" to be used. Used: [${result.toolsUsed.join(', ')}]`,
      };

    case 'tool_not_used':
      return {
        assertion,
        passed: !result.toolsUsed.includes(assertion.tool),
        actual: result.toolsUsed,
        message: `Expected tool "${assertion.tool}" NOT to be used. Used: [${result.toolsUsed.join(', ')}]`,
      };

    case 'extracted_field': {
      const value = getNestedValue(result.extractedData, assertion.path);
      const passed = deepEqual(value, assertion.expected);
      return {
        assertion,
        passed,
        actual: value,
        message: `Expected extractedData.${assertion.path} = ${JSON.stringify(assertion.expected)}, got ${JSON.stringify(value)}`,
      };
    }

    case 'response_contains': {
      const resp = assertion.caseSensitive ? result.responseText : result.responseText.toLowerCase();
      const search = assertion.caseSensitive ? assertion.value : assertion.value.toLowerCase();
      return {
        assertion,
        passed: resp.includes(search),
        actual: result.responseText.slice(0, 200),
        message: `Response should contain "${assertion.value}"`,
      };
    }

    case 'response_not_contains': {
      const resp = assertion.caseSensitive ? result.responseText : result.responseText.toLowerCase();
      const search = assertion.caseSensitive ? assertion.value : assertion.value.toLowerCase();
      return {
        assertion,
        passed: !resp.includes(search),
        actual: result.responseText.slice(0, 200),
        message: `Response should NOT contain "${assertion.value}"`,
      };
    }

    case 'response_language': {
      const passed = detectLanguage(result.responseText) === assertion.value;
      return {
        assertion,
        passed,
        actual: detectLanguage(result.responseText),
        message: `Expected response language "${assertion.value}", detected "${detectLanguage(result.responseText)}"`,
      };
    }

    case 'response_min_length':
      return {
        assertion,
        passed: result.responseText.length >= assertion.value,
        actual: result.responseText.length,
        message: `Response length ${result.responseText.length} < minimum ${assertion.value}`,
      };

    case 'response_max_length':
      return {
        assertion,
        passed: result.responseText.length <= assertion.value,
        actual: result.responseText.length,
        message: `Response length ${result.responseText.length} > maximum ${assertion.value}`,
      };

    case 'no_hallucinated_addresses': {
      const hallucinated = findHallucinatedAddresses(result.responseText, TEST_PROPERTIES);
      return {
        assertion,
        passed: hallucinated.length === 0,
        actual: hallucinated,
        message: hallucinated.length > 0
          ? `Found hallucinated addresses: ${hallucinated.join(', ')}`
          : 'No hallucinated addresses',
      };
    }

    case 'escalation_reason_contains': {
      const reason = result.escalationReason || '';
      const passed = reason.toLowerCase().includes(assertion.value.toLowerCase());
      return {
        assertion,
        passed,
        actual: reason,
        message: `Expected escalation reason to contain "${assertion.value}", got "${reason}"`,
      };
    }

    case 'photo_mode_equals':
      return {
        assertion,
        passed: result.photoMode === assertion.value,
        actual: result.photoMode,
        message: `Expected photoMode = ${assertion.value}, got ${result.photoMode}`,
      };

    case 'has_human_action_request':
      return {
        assertion,
        passed: result.humanActionRequests.length > 0,
        actual: result.humanActionRequests.length,
        message: `Expected at least one human action request, got ${result.humanActionRequests.length}`,
      };

    case 'custom':
      try {
        const passed = assertion.fn(result);
        return {
          assertion,
          passed,
          message: assertion.message || `Custom assertion "${assertion.name}" ${passed ? 'passed' : 'failed'}`,
        };
      } catch (err: any) {
        return {
          assertion,
          passed: false,
          message: `Custom assertion "${assertion.name}" threw: ${err.message}`,
        };
      }

    default:
      return {
        assertion,
        passed: false,
        message: `Unknown assertion type: ${(assertion as any).type}`,
      };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}

/**
 * Heuristic language detection based on character frequency + common word markers.
 */
function detectLanguage(text: string): 'en' | 'ru' | 'es' | 'unknown' {
  const cleaned = text.replace(/[^a-zA-Zа-яА-ЯёЁáéíóúñüÁÉÍÓÚÑÜ¿¡]/g, '');
  if (cleaned.length === 0) return 'unknown';

  const cyrillic = (cleaned.match(/[а-яА-ЯёЁ]/g) || []).length;
  const cyrillicRatio = cyrillic / cleaned.length;
  if (cyrillicRatio > 0.3) return 'ru';

  const spanishAccents = (cleaned.match(/[áéíóúñüÁÉÍÓÚÑÜ¿¡]/g) || []).length;
  if (spanishAccents / cleaned.length > 0.05) return 'es';

  const spanishWords = /\b(hola|por favor|gracias|buenas|disponible|arrendamiento|habitaciones|presupuesto|busca|apartamento|también|puede|mudarse|cuándo|tiene|cómo|dónde|necesito|quiero|estoy|busco|cuánto)\b/gi;
  const spanishMatches = (text.match(spanishWords) || []).length;
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 0 && spanishMatches / wordCount > 0.08) return 'es';

  return 'en';
}

function findHallucinatedAddresses(text: string, properties: { address?: string }[]): string[] {
  const knownAddresses = properties.map(p => (p.address || '').toLowerCase().trim());
  const addressPattern = /\b\d{1,6}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Way|Pl|Place|Cir|Circle|Pkwy|Parkway|Ter|Terrace|Loop|Trail|Run|Pass)\b\.?/gi;

  const found = text.match(addressPattern) || [];
  const hallucinated: string[] = [];

  for (const addr of found) {
    const normalized = addr.toLowerCase().trim().replace(/\.$/, '');
    const isKnown = knownAddresses.some(known =>
      known.includes(normalized) || normalized.includes(known.split(',')[0].trim())
    );
    if (!isKnown) hallucinated.push(addr);
  }

  return hallucinated;
}
