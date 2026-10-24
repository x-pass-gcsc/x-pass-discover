import type { PersonaDefinition } from '@/types/persona';
import type { ConversationMode } from '@/types/scenario';

export type AiTurn = { role: 'student' | 'persona'; content: string };

export type ScenarioAIInput = {
  persona: PersonaDefinition;
  /** Public scenario framing, from the scenario's `aiContext`. */
  scenarioContext: string;
  /** Summary of the student's own submitted work so far. */
  studentWorkSummary: string;
  history: AiTurn[];
  message: string;
  /** Facts this conversation has already surfaced. */
  alreadyRevealedFactIds: string[];
  /** From the task; the persona's `modeInstructions` say what it means. */
  mode: ConversationMode;
  /**
   * SERVER-ONLY steering notes, e.g. "the student's own terms break one of
   * their company's guardrails — do not treat this as settled". Never sent to
   * the client.
   */
  internalNotes?: string[];
};

export type ScenarioAIResponse = {
  content: string;
  /** Fact ids the reply actually disclosed. Validated server-side. */
  revealedFactIds: string[];
  /** Which adapter produced this, for the debug/admin view. */
  source: 'mock' | 'openai';
};

export interface ScenarioAIService {
  sendMessage(input: ScenarioAIInput): Promise<ScenarioAIResponse>;
}
