import { describe, it, expect } from 'vitest';
import { LlmApiError } from '../../src/llm/errors.js';

describe('callAnthropic', () => {
  it('throw LlmApiError khi ANTHROPIC_API_KEY khong duoc set', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      // Import inside the test (after deleting the env var) so the module's own
      // startup-time check (Step 3) runs against the missing-key state.
      const { callAnthropic } = await import('../../src/llm/anthropic-client.js?no-cache=' + Date.now());
      await expect(callAnthropic('system', 'user')).rejects.toThrow(LlmApiError);
    } finally {
      if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });
});
