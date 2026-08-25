import type { ChartPalace, PalaceRuleResult, Sihua } from '../types';
import { hasInterpretation } from '../types';
import { STAR_LABEL } from '../star-labels';

interface PalaceCellProps {
  palace: ChartPalace;
  isMenhPalace: boolean;
  ageAtDecadalStart: number;
  daiVanPalaceName?: string;
  luuNienPalaceName?: string;
  luuNienStars?: { star_id: string }[];
  ruleResult: PalaceRuleResult;
  onSelect: () => void;
}

const BRANCH_LABEL: Record<string, string> = {
  Ty: 'Tý', Suu: 'Sửu', Dan: 'Dần', Mao: 'Mão', Thin: 'Thìn', Ty2: 'Tỵ',
  Ngo: 'Ngọ', Mui: 'Mùi', Than: 'Thân', Dau: 'Dậu', Tuat: 'Tuất', Hoi: 'Hợi',
};

const BRIGHTNESS_LABEL: Record<string, string> = {
  mieu: 'Miếu', vuong: 'Vượng', dac: 'Đắc', loi: 'Lợi', binh: 'Bình', bat: 'Bất', ham: 'Hãm',
};

const SIHUA_LABEL: Record<Sihua['type'], string> = {
  Loc: 'Lộc', Quyen: 'Quyền', Khoa: 'Khoa', Ky: 'Kỵ',
};

function starLabel(starId: string): string {
  return STAR_LABEL[starId] ?? starId;
}

function sihuaFor(starId: string, sihua: Sihua[]): string | null {
  const hit = sihua.find((s) => s.star_id === starId);
  return hit ? SIHUA_LABEL[hit.type] : null;
}

export function PalaceCell({
  palace,
  isMenhPalace,
  ageAtDecadalStart,
  daiVanPalaceName,
  luuNienPalaceName,
  luuNienStars,
  ruleResult,
  onSelect,
}: PalaceCellProps) {
  const hasTriet = palace.adjective_stars.some((s) => s.star_id === 'TRIET_LO' || s.star_id === 'TRIET_KHONG');
  const hasTuan = palace.adjective_stars.some((s) => s.star_id === 'TUAN_KHONG');
  const catStars = palace.minor_stars.filter((s) => s.type === 'soft');
  const otherStars = palace.minor_stars.filter((s) => s.type !== 'soft');
  const showBadge = hasInterpretation(ruleResult);

  const cellClass = [
    'palace-cell',
    isMenhPalace ? 'palace-cell-menh' : '',
    palace.is_body_palace ? 'palace-cell-than' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cellClass} onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}>
      <div className="palace-top-row">
        <span className="palace-branch-stem">
          {palace.palace_stem}.{BRANCH_LABEL[palace.branch]}
          <span className="palace-element">-{palace.branch_element}</span>
        </span>
        <span className="palace-name">{palace.palace_name}</span>
        <span className="palace-age">{ageAtDecadalStart}</span>
      </div>
      {palace.major_stars.length > 0 && (
        <div className="major-row">
          {palace.major_stars.map((s) => {
            const sihuaText = sihuaFor(s.star_id, palace.sihua);
            return (
              <span key={s.star_id} className="star-chip">
                {starLabel(s.star_id)}
                {s.strength && <span className="brightness">({BRIGHTNESS_LABEL[s.strength]})</span>}
                {sihuaText && <span className="sihua-tag">Hóa {sihuaText}</span>}
              </span>
            );
          })}
        </div>
      )}
      {(catStars.length > 0 || otherStars.length > 0) && (
        <div className="minor-row">
          {[...catStars, ...otherStars].map((s) => {
            const sihuaText = sihuaFor(s.star_id, palace.sihua);
            return (
              <span key={s.star_id} className="star">
                {starLabel(s.star_id)}
                {s.strength ? `(${BRIGHTNESS_LABEL[s.strength]})` : ''}
                {sihuaText && <span className="sihua-tag">Hóa {sihuaText}</span>}
              </span>
            );
          })}
        </div>
      )}
      {palace.adjective_stars.length > 0 && (
        <div className="adj-row">
          {palace.adjective_stars.map((s) => (
            <span key={s.star_id} className="star">{starLabel(s.star_id)}</span>
          ))}
        </div>
      )}
      {(hasTuan || hasTriet) && (
        <div className="badge-row">
          {hasTuan && <span className="badge tuan">Tuần</span>}
          {hasTriet && <span className="badge triet">Triệt</span>}
        </div>
      )}
      <div className="cycle-strip">
        <div><span className="lbl">TS</span> {palace.truong_sinh}</div>
        <div><span className="lbl">ĐV</span> {daiVanPalaceName ?? '—'}</div>
        <div><span className="lbl">BS</span> {palace.boshi}</div>
        <div><span className="lbl">TT</span> {palace.jiangqian}</div>
        <div><span className="lbl">TuT</span> {palace.suiqian}</div>
      </div>
      {luuNienPalaceName && (
        <div className="luu-nien-line">
          <strong>LN.{luuNienPalaceName}</strong>
          {luuNienStars && luuNienStars.length > 0 && ` — ${luuNienStars.map((s) => starLabel(s.star_id)).join(', ')}`}
        </div>
      )}
      {showBadge && <div className="palace-has-interpretation" title="Có luận giải — bấm để xem" />}
    </div>
  );
}
