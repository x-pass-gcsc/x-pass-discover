import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import { env } from '@/lib/env';

/**
 * The server-side Claude client, for the few places that ask Claude for a
 * judgement or a piece of writing: the recommended department and the final
 * report's synthesis.
 *
 * The key lives only in the server environment (`ANTHROPIC_API_KEY`); nothing
 * here can be imported by client code (`server-only`). Every caller has a
 * rule-based fallback, so the app works the same with no key — `askClaudeJson`
 * returns null instead of throwing whenever Claude cannot give a usable
 * answer (no key, network error, refusal, an answer that fails the schema).
 */

let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (client !== undefined) return client;
  client = env.anthropicKey
    ? new Anthropic({ apiKey: env.anthropicKey, timeout: env.claudeTimeoutMs, maxRetries: 1 })
    : null;
  return client;
}

/** Models that accept the server-side refusal fallback (`fallbacks: 'default'`). */
const SERVER_FALLBACK_MODELS = /^claude-(opus-5|fable-5|mythos-5|sonnet-5-5)/;

export function claudeAvailable(): boolean {
  return !!env.anthropicKey;
}

export type ClaudeJsonRequest<T> = {
  /** Short label for the server log. */
  purpose: string;
  system: string;
  prompt: string;
  /** JSON schema sent as the structured output format. */
  jsonSchema: Record<string, unknown>;
  /** The same shape in zod, checked again on our side. */
  parse: z.ZodType<T>;
  maxTokens?: number;
  /** How hard Claude thinks; `low` suits a quick pick, `medium` a piece of writing. */
  effort?: 'low' | 'medium' | 'high';
};

/**
 * One structured request to Claude. Returns the parsed answer, or null when
 * there is no key or the answer cannot be used — the caller then falls back
 * to its rules.
 */
export async function askClaudeJson<T>(request: ClaudeJsonRequest<T>): Promise<T | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const response = await anthropic.beta.messages.create({
      model: env.claudeModel,
      max_tokens: request.maxTokens ?? 4000,
      // If a safety classifier declines, the API retries on its default
      // fallback model inside the same call (on the models that support it).
      ...(SERVER_FALLBACK_MODELS.test(env.claudeModel)
        ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
        : {}),
      output_config: {
        effort: request.effort ?? 'low',
        format: { type: 'json_schema', schema: request.jsonSchema },
      },
      system: request.system,
      messages: [{ role: 'user', content: request.prompt }],
    });
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      console.warn(`[claude:${request.purpose}] unusable stop reason: ${response.stop_reason}`);
      return null;
    }
    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();
    const parsed = request.parse.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.warn(`[claude:${request.purpose}] answer did not match the schema`);
      return null;
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`[claude:${request.purpose}] API error ${error.status}: ${error.message}`);
    } else {
      console.error(`[claude:${request.purpose}] failed:`, error);
    }
    return null;
  }
}
