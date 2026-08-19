import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { LlmApiError } from '../../src/llm/errors.js';

// Minimal standalone app reusing the SAME error middleware logic as src/server/app.ts,
// with two throwing routes — isolates the middleware's status-code branching from the
// full app's routes/dependencies.
function buildTestApp() {
  const app = express();
  app.get('/throws-llm-error', () => {
    throw new LlmApiError('gia lap loi goi Anthropic API');
  });
  app.get('/throws-plain-error', () => {
    throw new Error('input khong hop le');
  });
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = err instanceof LlmApiError ? 500 : 400;
    res.status(status).json({ error: message });
  });
  return app;
}

describe('error middleware', () => {
  it('tra ve 500 khi loi la LlmApiError', async () => {
    const res = await request(buildTestApp()).get('/throws-llm-error');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('gia lap loi goi Anthropic API');
  });

  it('tra ve 400 khi loi la Error thuong (khong doi hanh vi cu)', async () => {
    const res = await request(buildTestApp()).get('/throws-plain-error');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('input khong hop le');
  });
});
