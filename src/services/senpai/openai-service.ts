import 'server-only';
import OpenAI from 'openai';
import { env } from '@/lib/env';
import type { SenpaiInput, SenpaiService } from './types';

/**
 * OpenAI-backed senpai, for a deployment that has only the key the AI
 * employees already use. Same prompt, same streaming contract.
 */
export class OpenAISenpaiService implements SenpaiService {
  readonly provider = 'openai' as const;
  private client: OpenAI;

  constructor() {
    if (!env.openAiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAISenpaiService');
    }
    this.client = new OpenAI({ apiKey: env.openAiKey });
  }

  async *stream(input: SenpaiInput): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: env.senpaiOpenAiModel,
      stream: true,
      max_tokens: 1200,
      temperature: 0.7,
      messages: [
        { role: 'system', content: input.system },
        ...input.turns.map((turn) => ({
          role: turn.role === 'student' ? ('user' as const) : ('assistant' as const),
          content: turn.content,
        })),
      ],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
}
