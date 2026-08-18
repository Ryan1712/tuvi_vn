import type { ChartPalace, PalaceRuleResult } from '../types';
import { RuleResults } from './RuleResults';

interface PalaceCellProps {
  palace: ChartPalace;
  ageAtDecadalStart: number;
  daiVanPalaceName?: string;
  luuNienPalaceName?: string;
  ruleResult: PalaceRuleResult;
}

const BRANCH_LABEL: Record<string, string> = {
  Ty: 'Tý', Suu: 'Sửu', Dan: 'Dần', Mao: 'Mão', Thin: 'Thìn', Ty2: 'Tỵ',
  Ngo: 'Ngọ', Mui: 'Mùi', Than: 'Thân', Dau: 'Dậu', Tuat: 'Tuất', Hoi: 'Hợi',
};

const BRIGHTNESS_LABEL: Record<string, string> = {
  mieu: 'M', vuong: 'V', dac: 'Đ', loi: 'Lợi', binh: 'B', bat: 'Bất', ham: 'H',
};

function formatMinorStar(s: { star_id: string; strength?: string }): string {
  return s.strength ? `${s.star_id} (${BRIGHTNESS_LABEL[s.strength]})` : s.star_id;
}

export function PalaceCell({
  palace,
  ageAtDecadalStart,
  daiVanPalaceName,
  luuNienPalaceName,
  ruleResult,
}: PalaceCellProps) {
  const hasTriet = palace.adjective_stars.some((s) => s.star_id === 'TRIET_LO');
  const hasTuan = palace.adjective_stars.some((s) => s.star_id === 'TUAN_KHONG');
  const catStars = palace.minor_stars.filter((s) => s.type === 'soft');
  const otherStars = palace.minor_stars.filter((s) => s.type !== 'soft');

  return (
    <div className="palace-cell">
      <div className="palace-top-row">
        <span>
          {palace.palace_stem}.{BRANCH_LABEL[palace.branch]}
        </span>
        <span className="palace-name">{palace.palace_name}</span>
        <span className="palace-age">{ageAtDecadalStart}</span>
      </div>
      <div className="palace-element">-{palace.branch_element}</div>
      {palace.major_stars.map((s) => (
        <div key={s.star_id} className="palace-major">
          +{s.star_id}
          {s.strength ? ` (${BRIGHTNESS_LABEL[s.strength]})` : ''}
        </div>
      ))}
      <div className="palace-minor-grid">
        <div className="palace-minor-col-cat">
          {catStars.map((s) => (
            <div key={s.star_id}>{formatMinorStar(s)}</div>
          ))}
        </div>
        <div className="palace-minor-col-other">
          {otherStars.map((s) => (
            <div key={s.star_id}>{formatMinorStar(s)}</div>
          ))}
        </div>
      </div>
      {palace.adjective_stars.length > 0 && (
        <div className="palace-adjective">
          Tạp diệu: {palace.adjective_stars.map((s) => s.star_id).join(', ')}
        </div>
      )}
      <div className="palace-badges">
        {hasTuan && <span className="badge badge-tuan">Tuần</span>}
        {hasTriet && <span className="badge badge-triet">Triệt</span>}
      </div>
      <div className="palace-cycles">
        <div>Bác Sỹ: {palace.boshi}</div>
        <div>Tướng Tiền: {palace.jiangqian}</div>
        <div>Tuế Tiền: {palace.suiqian}</div>
      </div>
      <div className="palace-bottom-row">
        {daiVanPalaceName && <span>ĐV.{daiVanPalaceName}</span>}
        <span>Tràng Sinh: {palace.truong_sinh}</span>
      </div>
      {luuNienPalaceName && (
        <div className="palace-luu-nien">LN.{luuNienPalaceName}</div>
      )}
      <RuleResults result={ruleResult} />
    </div>
  );
}
