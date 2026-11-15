import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import type { SenpaiInput, SenpaiService } from './types';

/**
 * Claude-backed senpai.
 *
 * Effort is `low`: these are short conversational answers where speed matters
 * more than deep deliberation. The server-side refusal fallback keeps a
 * student's ordinary question from dead-ending if a safety classifier
 * misfires on the primary model.
 */
export class AnthropicSenpaiService implements SenpaiService {
  readonly provider = 'anthropic' as const;
  private client: Anthropic;

  constructor() {
    if (!env.anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY is required for AnthropicSenpaiService');
    }
    this.client = new Anthropic({ apiKey: env.anthropicKey });
  }

  async *stream(input: SenpaiInput): AsyncIterable<string> {
    const messages: Anthropic.Beta.BetaMessageParam[] = input.turns.map((turn) => ({
      role: turn.role === 'student' ? 'user' : 'assistant',
      content: turn.content,
    }));

    const stream = this.client.beta.messages.stream({
      model: env.senpaiAnthropicModel,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: input.system, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    let wrote = false;
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        wrote = true;
        yield event.delta.text;
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal' && !wrote) {
      throw new SenpaiDeclinedError();
    }
  }
}

/** The model (and its fallback) declined to answer this question. */
export class SenpaiDeclinedError extends Error {
  constructor() {
    super('The senpai declined to answer this question');
    this.name = 'SenpaiDeclinedError';
  }
}
