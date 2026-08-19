import type { BuildChartInput, ChartRulesResponse, ChartOverviewResponse } from './types';

async function postChart<T>(path: string, input: BuildChartInput): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchChartWithRules(input: BuildChartInput): Promise<ChartRulesResponse> {
  return postChart<ChartRulesResponse>('/api/charts/rules', input);
}

export function fetchChartOverview(input: BuildChartInput): Promise<ChartOverviewResponse> {
  return postChart<ChartOverviewResponse>('/api/charts/overview', input);
}
