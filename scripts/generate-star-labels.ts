/**
 * Sinh web/src/star-labels.ts tu STAR_ID_BY_VI trong src/chart/star-id-map.ts (dao nguoc
 * key/value: id -> ten co dau). KHONG import runtime tu src/chart/ (web/ khong cai iztro,
 * phai giu tach biet build) -- doc file nguon bang regex tren van ban thuan.
 *
 * Chay: npx tsx scripts/generate-star-labels.ts
 * (Chay lai moi khi src/chart/star-id-map.ts doi bang STAR_ID_BY_VI.)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE_PATH = 'src/chart/star-id-map.ts';
const OUTPUT_PATH = 'web/src/star-labels.ts';

const source = readFileSync(SOURCE_PATH, 'utf8');

const startMarker = 'const STAR_ID_BY_VI: Readonly<Record<string, string>> = {';
const startIdx = source.indexOf(startMarker);
if (startIdx === -1) {
  throw new Error(`Khong tim thay bang STAR_ID_BY_VI trong ${SOURCE_PATH}. File nguon co the da doi cau truc -- kiem tra lai truoc khi sua script nay.`);
}
const endIdx = source.indexOf('\n};', startIdx);
if (endIdx === -1) {
  throw new Error(`Khong tim thay dong dong bang (\`};\`) sau STAR_ID_BY_VI trong ${SOURCE_PATH}.`);
}
const tableBody = source.slice(startIdx + startMarker.length, endIdx);

const entryPattern = /'([^']+)':\s*'([A-Z_0-9]+)'/g;
const labelById: Record<string, string> = {};
let match: RegExpExecArray | null;
while ((match = entryPattern.exec(tableBody)) !== null) {
  const [, viName, starId] = match;
  labelById[starId] = viName;
}

const entryCount = Object.keys(labelById).length;
if (entryCount < 50) {
  throw new Error(`Chi parse duoc ${entryCount} entry tu STAR_ID_BY_VI -- qua it so voi ky vong (~80). Regex co the sai, KHONG ghi file output voi du lieu thieu.`);
}

const lines = Object.entries(labelById)
  .map(([id, vi]) => `  ${id}: ${JSON.stringify(vi)},`)
  .join('\n');

const output = `// TU DONG SINH boi scripts/generate-star-labels.ts tu src/chart/star-id-map.ts.
// KHONG SUA TAY FILE NAY -- sua ban goc (STAR_ID_BY_VI trong star-id-map.ts) roi chay lai:
//   npx tsx scripts/generate-star-labels.ts

export const STAR_LABEL: Readonly<Record<string, string>> = {
${lines}
};
`;

writeFileSync(OUTPUT_PATH, output, 'utf8');
console.log(`Da sinh ${OUTPUT_PATH} voi ${entryCount} nhan sao.`);
