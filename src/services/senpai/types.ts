import type { Locale } from '@/i18n/config';
import type { SenpaiProvider } from '@/lib/env';

/** One line of the senpai chat, as the browser keeps it. */
export type SenpaiTurn = { role: 'student' | 'senpai'; content: string };

export type SenpaiInput = {
  /** The system prompt built by `context.ts`. Server-side only. */
  system: string;
  /** Earlier turns, oldest first, ending with the student's new question. */
  turns: SenpaiTurn[];
  locale: Locale;
};

/**
 * The always-available senior colleague.
 *
 * Answers stream as plain text chunks so the window can show the reply as it is
 * written. Nothing here touches a bootcamp session: the senpai is a place to
 * ask, not evidence, so it writes no behaviour log and changes no score.
 */
export interface SenpaiService {
  readonly provider: SenpaiProvider;
  stream(input: SenpaiInput): AsyncIterable<string>;
}
