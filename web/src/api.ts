import type { BuildChartInput, ChartRulesResponse } from './types';

export async function fetchChartWithRules(
  input: BuildChartInput,
): Promise<ChartRulesResponse> {
  const res = await fetch('/api/charts/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as ChartRulesResponse;
}
