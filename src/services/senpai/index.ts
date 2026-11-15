import 'server-only';
import { env } from '@/lib/env';
import { AnthropicSenpaiService } from './anthropic-service';
import { MockSenpaiService } from './mock-service';
import { OpenAISenpaiService } from './openai-service';
import type { SenpaiService } from './types';

let cached: SenpaiService | null = null;

/** The senpai adapter for this deployment. See `env.senpaiProvider`. */
export function getSenpaiService(): SenpaiService {
  if (cached) return cached;
  try {
    if (env.senpaiProvider === 'anthropic') cached = new AnthropicSenpaiService();
    else if (env.senpaiProvider === 'openai') cached = new OpenAISenpaiService();
  } catch (error) {
    console.error('[senpai] falling back to offline mode:', error);
  }
  cached ??= new MockSenpaiService();
  return cached;
}

export { SenpaiDeclinedError } from './anthropic-service';
export { buildSenpaiSystemPrompt } from './context';
export { takeSenpaiQuota } from './rate-limit';
export type { SenpaiTurn } from './types';
