import { buildChart } from '../chart/index.js';
import type { BuildChartInput, Chart } from '../chart/types.js';
import { resolveQuery } from '../rule/query-resolver.js';
import type { DomainKey } from '../rule/types.js';
import { buildQueryEvidencePack } from './query-evidence-pack.js';
import { QUERY_SYSTEM_PROMPT, buildQueryUserMessage } from './query-prompt.js';
import { callAnthropic } from './anthropic-client.js';

export interface DomainQueryResponse {
  chart: Chart;
  domain: DomainKey;
  overview_text: string;
}

/**
 * Dieu phoi toan bo luong Tang 2: build Chart -> resolveQuery(domain) -> QueryEvidencePack
 * (chay du 4 scope cho moi cung, giu THU TU tu resolveQuery) -> goi LLM voi
 * QUERY_SYSTEM_PROMPT -> tra ve. Song song generateOverview cua Tang 1 nhung KHONG dung
 * chung EvidencePack/OVERVIEW_SYSTEM_PROMPT (xem design doc muc 4).
 */
export async function generateDomainQuery(
  input: BuildChartInput,
  domain: DomainKey,
): Promise<DomainQueryResponse> {
  const chart = buildChart(input);
  const branches = resolveQuery(chart, domain);

  const pack = buildQueryEvidencePack(input, chart, branches, domain);
  const overview_text = await callAnthropic(QUERY_SYSTEM_PROMPT, buildQueryUserMessage(pack));

  return { chart, domain, overview_text };
}
