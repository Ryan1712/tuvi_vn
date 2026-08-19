import Anthropic from '@anthropic-ai/sdk';
import { LlmApiError } from './errors.js';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 2048;

/**
 * Goi Anthropic API 1 luot (khong multi-turn) voi 1 system prompt + 1 user message,
 * tra ve text response. Moi that bai (thieu API key, network, auth, rate limit, response
 * khong co text block) deu throw LlmApiError — khong bao gio tra ve chuoi rong/gia.
 */
export async function callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    throw new LlmApiError(
      'ANTHROPIC_API_KEY khong duoc set. Dat bien moi truong nay truoc khi khoi dong server.',
    );
  }

  const client = new Anthropic({ apiKey });

  let message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new LlmApiError(`Goi Anthropic API that bai: ${detail}`);
  }

  const firstBlock = message.content[0];
  if (firstBlock === undefined || firstBlock.type !== 'text') {
    throw new LlmApiError(
      `Anthropic API tra ve response khong co text block dau tien (type: ${firstBlock?.type ?? 'khong co'}).`,
    );
  }
  return firstBlock.text;
}
