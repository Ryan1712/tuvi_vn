import { Router } from 'express';
import { buildChart } from '../chart/index.js';
import type { BuildChartInput } from '../chart/types.js';

export const router = Router();

router.post('/charts', (req, res) => {
  const chart = buildChart(req.body as BuildChartInput);
  res.status(200).json(chart);
});
