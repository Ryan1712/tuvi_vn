import express from 'express';
import { router } from './routes.js';
import { LlmApiError } from '../llm/errors.js';

export const app = express();

app.use(express.json());
app.use(router);

// Express 5 automatically forwards errors thrown from route handlers (sync or async) to this
// error middleware with no manual try/catch or next(err) calls needed; route handlers deliberately omit try/catch.
// LlmApiError (system failure calling the Anthropic API) maps to 500; every other thrown error
// (bad input, validation) maps to 400, unchanged from prior behavior.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  const status = err instanceof LlmApiError ? 500 : 400;
  res.status(status).json({ error: message });
});
