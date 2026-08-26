import { useState } from 'react';
import type { Branch, Chart, ChartRulesResponse } from '../types';
import { relatedBranches } from '../types';
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

// Tam cua 1 o tren luoi 4x4, tinh theo % (0..100) de dat SVG overlay len tren .palace-grid.
// GRID_POSITION la vi tri HIEN THI (1-4), khac voi index dia chi co dinh dung trong
// relatedBranches() — 2 he toa do khac nhau, KHONG duoc lan lon (xem ghi chu relatedBranches).
function cellCenterPercent(branch: Branch): { x: number; y: number } {
  const pos = GRID_POSITION[branch];
  return {
    x: (pos.column - 0.5) * 25,
    y: (pos.row - 0.5) * 25,
  };
}

// Diem noi LECH ve phia goc tren-trai cua o (huong nhan chi/can, .palace-top-row) thay vi
// dung tam o — dung anh goc tuvi.vn: duong cheo "dam sau" vao trong vung cung dich, khong
// dung lai o bien ngoai. Offset ~30% ban kinh 1 o ve phia goc tren-trai.
function cellAnchorPercent(branch: Branch): { x: number; y: number } {
  const center = cellCenterPercent(branch);
  const cellHalfSize = 12.5; // 25% / 2
  const offset = cellHalfSize * 0.6;
  return { x: center.x - offset, y: center.y - offset };
}

interface RelationLinesProps {
  fromBranch: Branch;
}

// Ve Tam Phuong Tu Chinh: DU 4 duong, dung theo xac nhan cua nguoi dung doi chieu tuvi.vn
// (khong phai 3 duong toa ra tu 1 diem). 4 duong = tam giac KHEP KIN giua 3 cung (cung dang
// hover + 2 cung tam hop — noi ca 3 canh voi nhau, KE CA canh giua 2 dinh tam hop, khong qua
// cung dang hover) CONG 1 duong rieng biet toi cung xung chieu. CHI hien khi hover, khong ve
// co dinh 12 cung — se roi. SVG overlay tuyet doi tren .palace-grid, khong chan click/hover
// cac o ben duoi (pointer-events: none).
function RelationLines({ fromBranch }: RelationLinesProps) {
  const { opposite, career, wealth } = relatedBranches(fromBranch);
  const from = cellAnchorPercent(fromBranch);
  const oppositePoint = cellAnchorPercent(opposite);
  const careerPoint = cellAnchorPercent(career);
  const wealthPoint = cellAnchorPercent(wealth);

  // 4 duong: tam giac (from-career, from-wealth, career-wealth) + 1 duong xung chieu rieng.
  const lines = [
    [from, careerPoint],
    [from, wealthPoint],
    [careerPoint, wealthPoint],
    [from, oppositePoint],
  ] as const;

  return (
    <svg className="relation-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={a.x} y1={a.y}
          x2={b.x} y2={b.y}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function CenterBlock({ chart, displayName }: { chart: Chart; displayName: string }) {
  const laiNhanPalace = chart.palaces.find((p) => p.is_original_palace);
  return (
    <div className="center-block">
      {displayName && <div className="center-title">{displayName}</div>}
      <div className="center-row">Ngày sinh: {chart.metadata.birth_solar_date} (dương) / {chart.metadata.birth_lunar_date} (âm)</div>
      <div className="center-row">Giờ: {chart.metadata.time_label} ({chart.metadata.time_range})</div>
      <div className="center-row">Năm can chi: {chart.metadata.year_can_chi}</div>
      <div className="center-row">Tứ trụ: {chart.metadata.chinese_date}</div>
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
  const [hoveredBranch, setHoveredBranch] = useState<Branch | null>(null);
  const selectedPalace = selectedBranch
    ? chart.palaces.find((p) => p.branch === selectedBranch)
    : null;

  // Nhom "sang" khi dang hover: chinh cung dang hover + 2 tam hop + 1 xung chieu. Cung khong
  // trong nhom nay se bi mo di (spotlight) — chi ap dung khi CO hover, khong anh huong trang
  // thai mac dinh.
  const highlightedBranches = hoveredBranch
    ? new Set<Branch>([hoveredBranch, ...Object.values(relatedBranches(hoveredBranch))])
    : null;

  return (
    <div className="palace-grid">
      {chart.palaces.map((palace) => {
        const pos = GRID_POSITION[palace.branch];
        const decadal = chart.luck_cycles.dai_van.find((d) => d.branch === palace.branch);
        const luuNienPalace = chart.luu_nien?.palaces.find((p) => p.branch === palace.branch);
        const isDimmed = highlightedBranches !== null && !highlightedBranches.has(palace.branch);
        return (
          <div
            key={palace.branch}
            className={isDimmed ? 'palace-dimmed' : ''}
            style={{ gridColumn: pos.column, gridRow: pos.row }}
            onMouseEnter={() => setHoveredBranch(palace.branch)}
            onMouseLeave={() => setHoveredBranch((cur) => (cur === palace.branch ? null : cur))}
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
      {hoveredBranch && <RelationLines fromBranch={hoveredBranch} />}
      <RuleResultsPanel
        branch={selectedBranch}
        palaceName={selectedPalace?.palace_name ?? null}
        ruleResult={selectedBranch ? rules_by_palace[selectedBranch] : null}
        onClose={() => setSelectedBranch(null)}
      />
    </div>
  );
}
