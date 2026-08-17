import { adaptFromIztro } from './adapter.js';
import { callIztro } from './iztro-client.js';
import type { BuildChartInput, Chart } from './types.js';

export type { Chart, BuildChartInput } from './types.js';
export { callIztro } from './iztro-client.js';
export { palaceOfBranch, palaceOfName, starsIn, relatedPalaces } from './queries.js';

export function buildChart(input: BuildChartInput): Chart {
  return adaptFromIztro(callIztro(input), input);
}
