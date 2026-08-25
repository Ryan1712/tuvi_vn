import { useState } from 'react';
import type { Branch, Chart, ChartRulesResponse } from '../types';
import { PalaceCell } from './PalaceCell';
import { RuleResultsPanel } from './RuleResultsPanel';

interface PalaceGridProps {
  data: ChartRulesResponse;
  displayName: string;
}

// Vi tri tren luoi CSS Grid 4x4, dung thu tu dia chi chuan tu vi (doi chieu voi anh
// goc tuvi.vn trong luc brainstorm — hang tren Ty-Ngo-Mui-Than, hang duoi Dan-Suu-Ty-Hoi).
const GRID_POSITION: Record<Branch, { column: number; row: number }> = {
  Ty2: { column: 1, row: 1 },
  Ngo: { column: 2, row: 1 },
  Mui: { column: 3, row: 1 },
  Than: { column: 4, row: 1 },
  Thin: { column: 1, row: 2 },
  Dau: { column: 4, row: 2 },
  Mao: { column: 1, row: 3 },
  Tuat: { column: 4, row: 3 },
  Dan: { column: 1, row: 4 },
  Suu: { column: 2, row: 4 },
  Ty: { column: 3, row: 4 },
  Hoi: { column: 4, row: 4 },
};

function CenterBlock({ chart, displayName }: { chart: Chart; displayName: string }) {
  const laiNhanPalace = chart.palaces.find((p) => p.is_original_palace);
  return (
    <div className="center-block">
      {displayName && <div className="center-title">{displayName}</div>}
      <div className="center-row">Ngày sinh: {chart.metadata.birth_solar_date} (dương) / {chart.metadata.birth_lunar_date} (âm)</div>
      <div className="center-row">Giờ: {chart.metadata.time_label} ({chart.metadata.time_range})</div>
      <div className="center-row">Năm can chi: {chart.metadata.year_can_chi}</div>
      {chart.luu_nien && <div className="center-row">Năm xem: {chart.luu_nien.year} ({chart.luu_nien.heavenly_stem}.{chart.luu_nien.earthly_branch})</div>}
      <div className="center-row">Bản mệnh: {chart.ban_menh_nap_am} — {chart.cuc.raw}</div>
      <div className="center-row">Chủ mệnh: {chart.menh_than.soul_star}</div>
      <div className="center-row">Chủ thân: {chart.menh_than.body_star}</div>
      {laiNhanPalace && <div className="center-row">Lai nhân cung: {laiNhanPalace.palace_name}</div>}
    </div>
  );
}

export function PalaceGrid({ data, displayName }: PalaceGridProps) {
  const { chart, rules_by_palace } = data;
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const selectedPalace = selectedBranch
    ? chart.palaces.find((p) => p.branch === selectedBranch)
    : null;

  return (
    <div className="palace-grid">
      {chart.palaces.map((palace) => {
        const pos = GRID_POSITION[palace.branch];
        const decadal = chart.luck_cycles.dai_van.find((d) => d.branch === palace.branch);
        const luuNienPalace = chart.luu_nien?.palaces.find((p) => p.branch === palace.branch);
        return (
          <div
            key={palace.branch}
            style={{ gridColumn: pos.column, gridRow: pos.row }}
          >
            <PalaceCell
              palace={palace}
              isMenhPalace={palace.branch === chart.menh_than.menh_branch}
              ageAtDecadalStart={decadal?.age_from ?? 0}
              daiVanPalaceName={decadal?.palace_name}
              luuNienPalaceName={luuNienPalace?.palace_name}
              luuNienStars={luuNienPalace?.stars}
              ruleResult={rules_by_palace[palace.branch]}
              onSelect={() => setSelectedBranch(palace.branch)}
            />
          </div>
        );
      })}
      <div style={{ gridColumn: '2 / 4', gridRow: '2 / 4' }}>
        <CenterBlock chart={chart} displayName={displayName} />
      </div>
      <RuleResultsPanel
        branch={selectedBranch}
        palaceName={selectedPalace?.palace_name ?? null}
        ruleResult={selectedBranch ? rules_by_palace[selectedBranch] : null}
        onClose={() => setSelectedBranch(null)}
      />
    </div>
  );
}
