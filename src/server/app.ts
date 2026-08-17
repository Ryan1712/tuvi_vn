import express from 'express';
import { router } from './routes.js';

export const app = express();

app.use(express.json());
app.use(router);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(400).json({ error: message });
});
