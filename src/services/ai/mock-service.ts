import type { PersonaFact } from '@/types/persona';
import { matchFacts, selectDisclosures } from './fact-matcher';
import type {
  ScenarioAIInput,
  ScenarioAIResponse,
  ScenarioAIService,
} from './types';

/**
 * Deterministic mock AI.
 *
 * Mock mode is not trying to sound human. It exists so the full scenario —
 * hidden-fact disclosure, follow-ups, the unexpected event and negotiation
 * state — is playable and testable with no OPENAI_API_KEY, behind exactly the
 * same interface as the production adapter.
 */

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(options: T[], seed: string): T {
  return options[hash(seed) % options.length];
}

function renderDisclosure(facts: PersonaFact[]): string {
  return facts.map((fact) => fact.content).join(' ');
}

export class MockScenarioAIService implements ScenarioAIService {
  async sendMessage(input: ScenarioAIInput): Promise<ScenarioAIResponse> {
    const { persona, message, alreadyRevealedFactIds, mode } = input;

    const matches = matchFacts(message, persona.facts, alreadyRevealedFactIds);
    const disclosed = selectDisclosures(matches);
    const seed = `${persona.key}:${input.history.length}:${message}`;

    const { mock } = persona;

    if (mock.style === 'coach') {
      const publicFact = persona.facts.find(
        (f) =>
          f.visibility === 'public' &&
          f.triggerTopics.some((t) => message.toLowerCase().includes(t)),
      );
      const body = publicFact
        ? `${publicFact.content} ${pick(mock.replies, seed)}`
        : pick(mock.replies, seed);
      return { content: body, revealedFactIds: [], source: 'mock' };
    }

    const probes =
      mode === 'negotiation' && mock.negotiationReplies?.length
        ? mock.negotiationReplies
        : mock.replies;

    // A follow-up should visibly react to what was just said.
    const lastStudentTurn = [...input.history]
      .reverse()
      .find((t) => t.role === 'student');
    const continuity =
      lastStudentTurn && input.history.length > 1
        ? 'Coming back to what you said a moment ago — '
        : '';

    const guardrailNote =
      input.internalNotes?.length && mock.steeringReply ? ` ${mock.steeringReply}` : '';

    if (disclosed.length > 0) {
      const content = `${renderDisclosure(disclosed)} ${pick(
        probes,
        seed,
      )}${guardrailNote}`;
      return {
        content: content.trim(),
        revealedFactIds: disclosed.map((f) => f.id),
        source: 'mock',
      };
    }

    const content = `${continuity}${pick(probes, seed)}${guardrailNote}`;
    return { content: content.trim(), revealedFactIds: [], source: 'mock' };
  }
}
