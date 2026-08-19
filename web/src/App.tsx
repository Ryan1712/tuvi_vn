import { useState } from 'react';
import { ChartForm } from './components/ChartForm';
import { PalaceGrid } from './components/PalaceGrid';
import { OverviewSection } from './components/OverviewSection';
import { fetchChartWithRules, fetchChartOverview } from './api';
import type { BuildChartInput, ChartRulesResponse } from './types';

function App() {
  const [data, setData] = useState<ChartRulesResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [overviewText, setOverviewText] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  async function handleSubmit(input: BuildChartInput, name: string) {
    setLoading(true);
    setError(null);
    setOverviewText(null);
    setOverviewError(null);
    try {
      const result = await fetchChartWithRules(input);
      setData(result);
      setDisplayName(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(false);

    setOverviewLoading(true);
    try {
      const overview = await fetchChartOverview(input);
      setOverviewText(overview.overview_text);
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setOverviewLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Tử Vi</h1>
      <ChartForm onSubmit={handleSubmit} />
      {loading && <p>Đang tính...</p>}
      {error && <p className="error">Lỗi: {error}</p>}
      {data && (
        <>
          <OverviewSection overviewText={overviewText} loading={overviewLoading} error={overviewError} />
          <PalaceGrid data={data} displayName={displayName} />
        </>
      )}
      <div className="legend">
        M:Miếu V:Vượng Đ:Đắc Lợi:Lợi B:Bình Bất:Bất H:Hãm
        <br />
        [Hóa Lộc/Quyền/Khoa/Kỵ]: Tứ Hóa của sao
      </div>
    </div>
  );
}

export default App;
