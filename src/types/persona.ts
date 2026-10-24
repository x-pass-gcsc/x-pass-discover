/**
 * Persona types.
 *
 * NOTE: these are types only (erased at build time). The *values* that fill
 * `systemPrompt`, `conversationRules` and hidden `PersonaFact` content live in
 * `src/content/**\/personas.server.ts`, which is `server-only`. Never import a
 * persona definition into a client component — use `PublicPersona` instead.
 */

import type { ConversationMode } from './scenario';

export type PersonaFactVisibility = 'public' | 'hidden';

export type PersonaFact = {
  id: string;
  /** Short client-safe label, e.g. "Morning sales velocity". */
  label: string;
  /** The actual fact. Hidden content must stay server-side until earned. */
  content: string;
  visibility: PersonaFactVisibility;
  /** Natural-language condition, also fed to the model in OpenAI mode. */
  disclosureRule: string;
  /** Deterministic fallback matcher used in mock mode and as a floor. */
  triggerTopics: string[];
};

export type PersonaDefinition = {
  key: string;
  name: string;
  role: string;
  organization: string;
  avatarColor: string;
  /** Portrait shown wherever this persona appears. */
  portrait: string;
  /** Client-safe framing the student is allowed to see. */
  visibleContext: string;
  /** First message the persona sends. Client-safe. */
  openingMessage: string;
  /** SERVER-ONLY. */
  systemPrompt: string;
  /** SERVER-ONLY. */
  conversationRules: string;
  facts: PersonaFact[];
  /** Which step keys this persona is reachable from. */
  stepKeys: string[];
  /**
   * What the persona is allowed to be told about the student's private work.
   * The QuickMart buyer must NOT see internal drafts — she only knows what the
   * student has actually said to her. The BITE manager legitimately sees them.
   */
  contextPolicy: { includeStudentWork: boolean };
  /** Office NPC placement so Phaser can position them. */
  officeZoneKey: string;
  /**
   * SERVER-ONLY. What each conversation mode means for this persona — for a
   * buyer, `negotiation` is trading deal terms; for an executive, defending a
   * recommendation. Appended to the system prompt in the matching mode.
   */
  modeInstructions?: Partial<Record<ConversationMode, string>>;
  /**
   * SERVER-ONLY. How the deterministic mock adapter speaks for this persona.
   * `coach` personas hand the question back and may share public facts;
   * `counterpart` personas disclose hidden facts when a question earns them.
   */
  mock: {
    style: 'coach' | 'counterpart';
    replies: string[];
    /** Used instead of `replies` in `negotiation` mode, when present. */
    negotiationReplies?: string[];
    /** Appended when server-side steering says nothing is agreed yet. */
    steeringReply?: string;
  };
};
