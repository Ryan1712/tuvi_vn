# Tầng 2 — Domain Query (LLM trả lời theo chủ đề) — Design Doc

## 0. Bối cảnh

Tầng 1 (`POST /charts/overview`) trả về bài đọc mở đầu, luôn phủ đủ 12 cung, không nhận câu
hỏi cụ thể. Tầng 2 làm ngược lại: nhận 1 domain (chủ đề — "sự nghiệp", "hôn nhân", "sức
khỏe"...), thu hẹp về đúng (những) cung liên quan, và trả lời sâu hơn cho domain đó — bao gồm
CẢ đặc điểm bản chất (tĩnh) LẪN ý nghĩa theo giai đoạn Đại Vận CỦA CHÍNH CUNG ĐÓ (không nhất
thiết là Đại Vận hiện tại — xem mục 3) và theo năm (nếu có `view_year`).

Phase này CHỈ làm được sau khi Rule Engine v0.4 (`chart_id` cho `DaiVan`/`LuuNien`) hoàn tất —
`evaluateDecadeRule`/`evaluateAnnualRule` giờ mới có guard chart-mismatch đáng tin cậy để gọi
từ 1 orchestrator dùng chung nhiều scope cùng lúc.

**Ngoài phạm vi phase này** (đã thống nhất qua brainstorm):
- Nhận câu hỏi tự nhiên ("công việc năm sau thế nào") rồi tự map sang domain qua LLM/NLU —
  v0.1 chỉ nhận `domain` dạng enum cố định, UI/caller tự chọn. NLU là 1 phase riêng sau này.
- Sửa `EvidencePack`/`overview-prompt.ts` của Tầng 1 — đã verify thật với LLM, không đụng vào
  để tránh rủi ro hồi quy hành vi (không bắt được bằng test tự động).

## 1. `DOMAIN_PALACE_MAP` — bảng tri thức domain → cung

Tri thức Tử Vi thật (domain nào xem cung nào), CÓ THỂ có dị bản giữa trường phái — theo
CLAUDE.md mục 9, không hard-code ngầm trong code, phải đi qua đúng quy trình minh bạch nguồn
gốc như mọi tri thức khác trong dự án.

**KHÔNG phải Rule.** Một domain-mapping không có điều kiện để evaluate trên Chart (không đúng/
sai tùy dữ liệu lá số) — nó là 1 phép tra cứu tĩnh (domain string → cung), khác bản chất với
Rule (mệnh đề có thể match:true/false). Ép nó vào Rule Schema (thêm `scope: 'domain_mapping'`
rồi evaluator luôn trả `matched: true`) là loại "ép cấu trúc dữ liệu khớp code dù không khớp
bản chất" đã bị từ chối nhiều lần trong dự án (Tuần/Triệt, Tứ Hóa, `LuuNienPalace.stars`).

Vẫn giữ trường provenance (như `Source`) vì đây vẫn là tri thức thật cần minh bạch nguồn gốc —
chỉ khác CÁCH DÙNG (tra cứu theo domain-string, không evaluate trên Chart), không khác YÊU CẦU
minh bạch nguồn gốc.

### 1.1 Types mới (`src/rule/types.ts`)

```ts
/**
 * 12 domain — dat ten theo cung Han Viet (khong theo ngu nghia cau hoi tu nhien, vi
 * NLU/map cau hoi tu do -> domain la 1 phase rieng sau nay, khong lam o v0.1).
 */
export type DomainKey =
  | 'menh' | 'phu_mau' | 'phuc_duc' | 'dien_trach' | 'quan_loc' | 'no_boc'
  | 'thien_di' | 'tat_ach' | 'tai_bach' | 'tu_tuc' | 'phu_the' | 'huynh_de';

export interface DomainPalaceEntry {
  domain: DomainKey;
  /**
   * Ten cung LIEN QUAN, LUON la mang (ke ca domain khong mo ho chi co 1 phan tu) — nhat
   * quan voi resolveQuery() luon tra Branch[]. Thu tu phan tu = muc do quan trong (phan
   * tu dau = quan trong nhat) — dung THU TU thay vi them field primary/secondary rieng,
   * giu kieu du lieu don gian.
   *
   * LUU THEO TEN CUNG (string, khop ChartPalace.palace_name), KHONG PHAI Branch truc
   * tiep — vi cung "Quan Loc" ten co dinh nhung branch (Ty, Suu...) no roi vao THAY DOI
   * theo tung la so (phu thuoc gio/ngay sinh). resolveQuery() se tra palace_name -> Branch
   * cua CHINH la so dang xet (xem muc 2).
   */
  palace_names: string[];
  school: string;
  sources: string[]; // ref(Source.source_id), giong Rule.sources
  consensus: Consensus; // vd domain 'phu_mau' anh xa ca Phu Mau lan Huynh De la tranh_cai
  notes: string;
}
```

`Consensus` đã có sẵn trong `types.ts`, không cần import thêm.

### 1.2 Dữ liệu (`src/rule/knowledge-base.ts`)

10 domain rõ ràng (1 cung), 2 domain mơ hồ (nhiều cung, đã thống nhất trong brainstorm trước
đây của dự án):

```ts
export const DOMAIN_PALACE_MAP: DomainPalaceEntry[] = [
  { domain: 'menh', palace_names: ['Mệnh'], school: '...', sources: [...], consensus: 'cao', notes: '...' },
  { domain: 'phu_mau', palace_names: ['Phụ Mẫu', 'Huynh Đệ'], ..., consensus: 'tranh_cai', notes: 'Cha me: 1 so truong phai chi xem Phu Mau, 1 so khac tinh ca Huynh De (anh chi em ho hang gan). Thu tu: Phu Mau truoc.' },
  { domain: 'phuc_duc', palace_names: ['Phúc Đức'], ... },
  { domain: 'dien_trach', palace_names: ['Điền Trạch'], ... },
  { domain: 'quan_loc', palace_names: ['Quan Lộc'], ... },
  { domain: 'no_boc', palace_names: ['Nô Bộc'], ... },
  { domain: 'thien_di', palace_names: ['Thiên Di'], ... },
  { domain: 'tat_ach', palace_names: ['Tật Ách'], ... },
  { domain: 'tai_bach', palace_names: ['Tài Bạch'], ... },
  { domain: 'tu_tuc', palace_names: ['Tử Tức'], ... },
  { domain: 'phu_the', palace_names: ['Phu Thê', 'Tử Tức'], ..., consensus: 'tranh_cai', notes: 'Hon nhan: cung chinh la Phu The. Mot so goc hoi (con cai anh huong hon nhan) tham chieu them Tu Tuc. Thu tu: Phu The truoc.' },
  { domain: 'huynh_de', palace_names: ['Huynh Đệ'], ... },
];
```

Các chuỗi `palace_names` ở trên (VD `'Quan Lộc'`, `'Phụ Mẫu'`) là GIÁ TRỊ MINH HỌA — phải verify
khớp CHÍNH XÁC với `ChartPalace.palace_name` thật sinh ra từ `iztro` khi viết plan (build 1 chart
mẫu, đọc `chart.palaces[].palace_name` trực tiếp), không gõ theo trí nhớ — xem mục 8 Known Issues.

## 2. `resolveQuery` — vì sao cần nhận `chart`, không chỉ `domain`

Cung Mệnh, Phụ Mẫu, Quan Lộc... là TÊN CUNG CỐ ĐỊNH (mỗi lá số có đúng 1 cung tên "Quan Lộc"),
nhưng cung đó nằm ở `Branch` nào (Tý, Sửu...) THAY ĐỔI theo từng lá số — phụ thuộc giờ/ngày
sinh. Domain-mapping tri thức thật ("xem sự nghiệp → xem cung Quan Lộc") ánh xạ domain →
**tên cung**, không map thẳng domain → `Branch` cố định — đây là lý do `DOMAIN_PALACE_MAP` lưu
`palace_names: string[]` (mục 1) thay vì `Branch[]`.

Vì vậy `resolveQuery` cần nhận `chart` để tra `palace_name → Branch` của CHÍNH lá số đó:

```ts
export function resolveQuery(chart: Chart, domain: DomainKey): Branch[] {
  const entry = DOMAIN_PALACE_MAP.find((e) => e.domain === domain);
  if (entry === undefined) {
    throw new Error(`resolveQuery: khong tim thay domain "${domain}" trong DOMAIN_PALACE_MAP.`);
  }
  return entry.palace_names.map((name) => {
    const palace = chart.palaces.find((p) => p.palace_name === name);
    if (palace === undefined) {
      throw new Error(`resolveQuery: khong tim thay cung "${name}" trong chart.palaces.`);
    }
    return palace.branch;
  });
}
```

Hàm vẫn giữ đúng nguyên tắc đã chốt trong brainstorm: **chỉ trả lời "domain này ứng cung
nào", không tự gọi evaluator nào, không tự gắn Đại Vận/Lưu Niên** — việc thêm tham số `chart`
là để tra cứu cấu trúc lá số (palace_name → branch), không phải để evaluate Rule. Ranh giới
"không tự suy luận ngữ cảnh" vẫn giữ nguyên; đây thuần túy là sửa lỗi thiết kế ban đầu (nhầm
domain-mapping map thẳng sang `Branch`, thực ra map sang tên cung).

Vị trí: `src/rule/query-resolver.ts` (file mới, cạnh `relation-evaluator.ts`, `decade-
evaluator.ts`, `annual-evaluator.ts` — theo đúng cấu trúc `src/rule/` hiện có, 1 file/1 trách
nhiệm).

## 3. Orchestrator — `src/llm/query.ts`

Song song `overview.ts` (Tầng 1), nhưng khác ở chỗ chỉ xử lý tập con cung từ `resolveQuery`,
và với MỖI cung, chạy **tất cả scope hợp lệ** — không tự lọc theo "thời điểm câu hỏi":

- **`star_combination`/`palace_relationship`** — LUÔN chạy (đặc điểm bản chất, không đổi theo
  thời gian). Dùng `matchRules`/`evaluateRelationRule` sẵn có.
- **`decade`** — LUÔN chạy, nhưng KHÔNG dùng Đại Vận hiện tại (xem phần "Decade dùng Đại Vận
  nào" ngay dưới đây — đây là 1 quyết định ngữ nghĩa riêng, tách khỏi câu hỏi "chạy hay không
  chạy").
- **`annual`** — CHỈ chạy khi `input.view_year` được truyền (đây mới là phần thực sự có điều
  kiện — `chart.luu_nien` chỉ tồn tại khi `view_year` có). Đây là annual, KHÔNG PHẢI decade.

**Decade dùng Đại Vận nào — KHÔNG PHẢI Đại Vận hiện tại (phát hiện qua review, khác giả định
ban đầu của bản nháp trước):** `evaluateDecadeRule(chart, daiVan, rule)` (đã chốt ở v0.2) là
hàm thuần túy — nhận `DaiVan` xác định sẵn từ caller, không tự chọn "Đại Vận nào". Với domain-
query, câu hỏi thật KHÔNG PHẢI "hiện tại có đang là giai đoạn Quan Lộc không" (thường sẽ rỗng —
Đại Vận hiện tại hiếm khi trùng branch của cung đang hỏi, gây cảm giác "thiếu" không rõ vì sao,
gần như vô dụng cho mục đích sản phẩm), mà là **"giai đoạn Quan Lộc của cả đời là lúc nào, nó
thế nào"** — tức là tìm entry trong `chart.luck_cycles.dai_van` có `branch` KHỚP với branch của
CUNG ĐANG HỎI (không phải khớp tuổi hiện tại), rồi evaluate decade Rules cho đúng entry đó.

```ts
/** Tim Dai Van co branch khop cung dang hoi — KHAC currentDaiVan() cua evidence-pack.ts
 *  (ham do tra loi cau hoi "tuoi hien tai", cau hoi o day la "giai doan nao trong doi"). */
function daiVanAtBranch(chart: Chart, branch: Branch): DaiVan {
  const entry = chart.luck_cycles.dai_van.find((d) => d.branch === branch);
  if (entry === undefined) {
    throw new Error(`daiVanAtBranch: khong tim thay Dai Van nao co branch "${branch}".`);
  }
  return entry;
}
```

Vị trí: hàm mới, nhỏ, đặt cạnh `resolveQuery` trong `src/rule/query-resolver.ts` (không phải
`evidence-pack.ts` — đây không phải "tuổi hiện tại", không dùng chung logic với
`currentDaiVan()`). `evaluateDecadeRule` KHÔNG đổi — vẫn nhận `DaiVan` từ caller như đã chốt.

**Cả 2 câu hỏi (a) "hiện tại có phải giai đoạn này" và (b) "giai đoạn này là khi nào" đều được
giữ, không câu nào bị mất** — `QueryEvidencePack.current_dai_van` (mục 4, kế thừa từ
`EvidencePack`) vẫn trả lời (a) như Facts bối cảnh chung (không gắn riêng domain nào), còn
decade-scope `interpretation_groups` của domain-query giờ trả lời (b). 2 mục đích khác nhau,
cùng có mặt trong response — không loại trừ nhau.

Lý do chạy hết thay vì lọc theo thời điểm câu hỏi (đã chốt trong brainstorm): đúng tinh thần
"Facts đầy đủ, Interpretation chỉ giới hạn ở Rule matched" của CLAUDE.md mục 2 — giới hạn nên
nằm ở tầng diễn giải (system prompt), không nằm ở tầng thu thập dữ kiện. Chi phí thêm 1-2
evaluator thuần code gần như miễn phí (không gọi thêm LLM).

**Bảo toàn thứ tự ưu tiên xuyên suốt pipeline (điểm dễ bị đánh rơi, nêu rõ ở đây để không lặp
lại):** `resolveQuery` trả `Branch[]` theo đúng thứ tự `palace_names` trong `DOMAIN_PALACE_MAP`
(phần tử đầu = cung quan trọng nhất — mục 1). Orchestrator PHẢI giữ nguyên thứ tự này khi build
`QueryEvidencePack.palaces` — KHÔNG được sắp xếp lại theo `Branch` (VD theo thứ tự 12 địa chi cố
định), vì làm vậy sẽ xóa mất tín hiệu "cung nào quan trọng hơn" mà `DOMAIN_PALACE_MAP` đã cố
tình mã hóa qua thứ tự mảng. Cụ thể: `branches.map((b) => buildPalaceEntry(chart, b, ...))` —
dùng `.map()` trên chính mảng `branches` đã nhận từ `resolveQuery`, không `.filter()` từ
`chart.palaces` (thứ tự gốc của `chart.palaces` là theo `Branch`, không phải theo độ ưu tiên
domain). Xem thêm mục 5 quy tắc 7 — system prompt cũng cần được hướng dẫn dùng đúng thứ tự này.

```ts
export interface DomainQueryResponse {
  chart: Chart;
  domain: DomainKey;
  overview_text: string;
}

export async function generateDomainQuery(
  input: BuildChartInput,
  domain: DomainKey,
): Promise<DomainQueryResponse> {
  const chart = buildChart(input);
  const branches = resolveQuery(chart, domain);

  const pack = buildQueryEvidencePack(input, chart, branches);
  const overview_text = await callAnthropic(QUERY_SYSTEM_PROMPT, buildQueryUserMessage(pack, domain));

  return { chart, domain, overview_text };
}
```

## 4. `QueryEvidencePack` — interface riêng, KHÔNG sửa `EvidencePack` của Tầng 1

**Quyết định (đã chốt trong brainstorm):** interface riêng biệt trong file mới
(`src/llm/query-evidence-pack.ts`), không sửa `src/llm/evidence-pack.ts`. Lý do: `EvidencePack`
của Tầng 1 đã verify thật với LLM (gọi thật 1 lần, đọc kết quả bằng mắt xác nhận ranh giới
Facts/Interpretation) — sửa shape dữ liệu đưa vào prompt là rủi ro hồi quy hành vi LLM, loại
rủi ro khó bắt bằng test tự động (không assert được nội dung văn bản sinh ra). Cùng nguyên tắc
đã áp dụng xuyên suốt dự án: khi 2 nhu cầu khác nhau về bản chất, tách interface riêng thay vì
1 struct đa nghĩa dùng chung.

`QueryEvidencePack` KHÁC `EvidencePack` ở đúng 3 điểm cốt lõi:
1. `palaces`/interpretations chỉ gồm cung từ `resolveQuery`, không phải toàn bộ 12 cung.
2. Interpretations **nhóm theo scope** thay vì để phẳng — để LLM phân biệt "đặc điểm bản
   chất" (star_combination/palace_relationship) vs "ý nghĩa giai đoạn" (decade) vs "riêng năm
   nay" (annual). Đây chính là insight đã ghi trong Known Issues của decade design doc
   (2026-08-19-rule-engine-v02-decade-design.md) — giờ là lúc dùng tới.
3. Mảng `palaces` giữ ĐÚNG THỨ TỰ trả về từ `resolveQuery` (phần tử đầu = cung quan trọng
   nhất theo `DOMAIN_PALACE_MAP` — mục 1, mục 3), KHÔNG sắp xếp lại theo `Branch`. `EvidencePack`
   của Tầng 1 không có khái niệm thứ tự ưu tiên (luôn đủ 12 cung, không domain nào "quan trọng
   hơn") — đây là điểm khác biệt riêng của `QueryEvidencePack`, chỉ có ý nghĩa khi domain trả
   nhiều cung (VD `phu_mau`, `phu_the`).

```ts
export type InterpretationScope = 'star_combination' | 'palace_relationship' | 'decade' | 'annual';

export interface QueryEvidencePack {
  menh_than: EvidencePack['menh_than'];
  cuc: EvidencePack['cuc'];
  ban_menh_nap_am: string;
  domain: DomainKey;
  palaces: {
    branch: Branch;
    palace_name: string;
    major_stars: { star_id: string; strength?: Brightness }[];
    minor_stars: { star_id: string; strength?: Brightness }[];
    branch_element: NguHanh;
    /** Nhom interpretation THEO SCOPE cho dung cung nay — khong de phang. */
    interpretation_groups: {
      scope: InterpretationScope;
      /**
       * CHI co gia tri khi scope === 'decade' — age_from/age_to cua CHINH Dai Van dang
       * dung de evaluate cung nay (tim theo branch, xem muc 3 "Decade dung Dai Van nao"),
       * KHONG PHAI Dai Van hien tai. Bat buoc de LLM tu xac dinh THI (da qua/hien tai/
       * tuong lai) theo quy tac 7 (muc 5) — thieu field nay, LLM khong the tuan thu quy
       * tac do vi khong co du lieu de so sanh voi tuoi hien tai.
       */
      decade_age_range: { age_from: number; age_to: number } | null;
      /** Chi hien dien khi scope co du lieu that (VD decade luon co, annual chi co khi view_year). */
      items: {
        rule_id: string;
        conclusion_text: string;
        valence: Valence;
        consensus: Consensus;
        conflict_group_id: string | null;
      }[];
    }[];
  }[];
  /**
   * Facts boi canh chung (khong gan domain nao) — tra loi cau hoi (a) "hien tai dang o giai
   * doan nao" (xem muc 3). QUAN TRONG: `nominal_age` trong day la con so LLM PHAI dung de so
   * sanh voi tung `decade_age_range` (trong interpretation_groups cua tung cung) de xac dinh
   * THI theo quy tac 7 (muc 5) — 2 field nay lien quan truc tiep, khong doc lap.
   */
  current_dai_van: EvidencePack['current_dai_van'];
  /** Chi co khi input.view_year duoc truyen. */
  current_luu_nien: { year: string; heavenly_stem: string; earthly_branch: string } | null;
}
```

**Tái dùng, không viết lại từ đầu:** hàm dựng `QueryEvidencePack` tái dùng các helper nhỏ đã
có trong `evidence-pack.ts` (đọc palace facts từ `ChartPalace`, join `Rule.rule_id → conclusion`)
ở mức hàm — chỉ khác bước tổ chức cuối (group theo scope thay vì để phẳng). Cụ thể: nếu
`evidence-pack.ts` chưa export các bước trung gian này như hàm riêng, tách chúng ra
(`resolvePalaceFacts(palace): ...`, `resolveInterpretation(rule): ...`) rồi dùng lại ở cả 2
nơi — tránh 2 đường độc lập cùng đọc `Chart`/`Rule` mà có thể lệch nhau nếu sau này 1 bên sửa
quên đồng bộ (đúng nguyên tắc đã giữ với `chart_id`).

## 5. System prompt cho domain-query — `src/llm/query-prompt.ts`

**Không copy nguyên văn 5 quy tắc cũ của Tầng 1 rồi thêm 1 quy tắc groups hời hợt.** Bài học
từ Tầng 1: ranh giới Facts/Interpretation chỉ hoạt động đúng nhờ có ví dụ ĐÚNG/SAI cụ thể neo
trong prompt, không chỉ luật trừu tượng. Áp đúng bài học đó cho quy tắc mới về phân biệt 3
lăng kính thời gian.

Giữ nguyên các quy tắc 1-4, 6 của `OVERVIEW_SYSTEM_PROMPT` (ranh giới Facts/Interpretation,
giữ nguyên ý conclusion_text, trình bày đủ conflict_group, không tự thêm tri thức ngoài, diễn
đạt theo consensus) — các quy tắc này áp dụng y hệt cho domain-query, không đổi.

Quy tắc 5 cũ ("đây là bài đọc mở đầu, không đưa lời khuyên quyết định") **đổi khác** — domain-
query LÀ trả lời có mục tiêu theo domain, không phải bài đọc mở đầu — nhưng vẫn giữ tinh thần
"trình bày xu hướng, không quyết định thay người dùng".

**Quy tắc MỚI (7) — phân biệt 3 lăng kính thời gian, với ví dụ đúng/sai cụ thể:**

```
7. MỖI cung trong dữ liệu có "interpretation_groups" chia theo scope — PHẢI diễn đạt khác nhau
   theo từng nhóm, không trộn lẫn thành 1 giọng văn duy nhất:
   - scope "star_combination"/"palace_relationship": đặc điểm BẢN CHẤT, KHÔNG đổi theo thời
     gian — dùng thì hiện tại ổn định ("bạn LÀ người...", "cung này CÓ đặc điểm...").
   - scope "decade": ý nghĩa RIÊNG của 1 giai đoạn Đại Vận cụ thể (KHÔNG NHẤT THIẾT là Đại Vận
     hiện tại — có thể đã qua hoặc chưa tới) — PHẢI nêu rõ đây là đặc điểm của giai đoạn đó,
     không phải đặc điểm suốt đời, VÀ phải tự xác định đúng THÌ bằng cách so sánh
     "decade_age_range" (age_from/age_to của CHÍNH nhóm decade đang đọc) với
     "current_dai_van.nominal_age" (tuổi hiện tại của người xem):
       - Nếu decade_age_range.age_to < current_dai_van.nominal_age: giai đoạn ĐÃ QUA — dùng
         "trong giai đoạn Đại Vận từ ... đến ... tuổi (đã qua)" hoặc thì quá khứ.
       - Nếu decade_age_range.age_from <= current_dai_van.nominal_age <= decade_age_range.age_to:
         giai đoạn ĐANG DIỄN RA — dùng "trong giai đoạn Đại Vận hiện tại (từ ... đến ... tuổi)".
       - Nếu decade_age_range.age_from > current_dai_van.nominal_age: giai đoạn SẮP TỚI — dùng
         "trong giai đoạn Đại Vận sắp tới (từ ... đến ... tuổi)" hoặc thì tương lai.
   - scope "annual": ý nghĩa RIÊNG của năm được xem — PHẢI nêu rõ đây là đặc điểm CHỈ năm đó
     ("RIÊNG NĂM [năm], ...").

   Nếu "palaces" có NHIỀU HƠN 1 cung (domain mơ hồ, VD hỏi về cha mẹ trả cả Phụ Mẫu lẫn Huynh
   Đệ), PHẢI trình bày theo ĐÚNG THỨ TỰ xuất hiện trong "palaces" — cung xuất hiện TRƯỚC là cung
   chính/quan trọng hơn cho domain này, trình bày trước và chi tiết hơn; cung xuất hiện SAU là
   góc nhìn bổ sung, có thể trình bày ngắn gọn hơn hoặc nêu rõ đây là góc nhìn phụ ("xét thêm
   góc độ...", "một số quan điểm còn xem thêm..."). KHÔNG đảo thứ tự, KHÔNG cho 2 cung mức độ
   quan trọng ngang nhau khi dữ liệu đã sắp xếp có thứ tự.

   Ví dụ ĐÚNG — decade là giai đoạn ĐANG DIỄN RA (age_from <= tuổi hiện tại <= age_to):
   "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ trong công việc [star_combination].
   Trong giai đoạn Đại Vận hiện tại (32-41 tuổi), có xu hướng thay đổi công việc hoặc hướng đi
   sự nghiệp [decade]."

   Ví dụ ĐÚNG — decade là giai đoạn ĐÃ QUA (age_to < tuổi hiện tại, VD người xem hiện 35 tuổi
   nhưng giai đoạn Đại Vận tại cung Quan Lộc là 12-21 tuổi):
   "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ trong công việc [star_combination].
   Trong giai đoạn Đại Vận tại cung này (12-21 tuổi, đã qua), từng có xu hướng thay đổi định
   hướng nhiều lần [decade]."

   Ví dụ SAI (2 lỗi cùng lúc): "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ, và
   có xu hướng thay đổi công việc" — (1) gộp 2 nhóm scope thành 1 câu, không phân biệt đâu là
   bản chất suốt đời, đâu là chỉ đúng 1 giai đoạn — người đọc không biết đặc điểm nào sẽ hết
   khi qua Đại Vận đó; (2) không nêu mốc tuổi/thì của giai đoạn decade, mặc định ngầm là "hiện
   tại" dù giai đoạn đó trong dữ liệu có thể đã qua từ lâu hoặc còn ở tương lai — CẤM cả 2.
```

## 6. API — `POST /charts/query`

Endpoint mới, tách biệt hoàn toàn `/charts/overview` (không dùng domain optional param trên
cùng 1 endpoint — 2 mục đích khác nhau: 1 luôn trả 12 cung, 1 luôn trả tập con theo domain;
gộp lại sẽ tạo 1 endpoint đa hình thay đổi hình dạng response tùy có truyền domain hay không —
đúng loại vấn đề đã từ chối ở tầng dữ liệu, Tuần/Triệt, `current_dai_van`).

**Request:**
```ts
{
  ...BuildChartInput, // giong /charts/overview
  domain: DomainKey,  // enum co dinh, 1 trong 12 gia tri — KHONG nhan cau hoi tu do o v0.1
}
```

**Response:**
```ts
{ chart: Chart, domain: DomainKey, overview_text: string }
```

`src/server/routes.ts` thêm `router.post('/charts/query', ...)` gọi `generateDomainQuery`,
validate `domain` khớp 1 trong 12 `DomainKey` (fail loud nếu không, theo đúng convention project
— throw rõ ràng, không âm thầm bỏ qua/mặc định).

## 7. File Structure tổng hợp

| File | Trách nhiệm |
|---|---|
| `src/rule/types.ts` (sửa) | Thêm `DomainKey`, `DomainPalaceEntry` |
| `src/rule/knowledge-base.ts` (sửa) | Thêm `DOMAIN_PALACE_MAP` (12 entries) |
| `src/rule/query-resolver.ts` (mới) | `resolveQuery(chart, domain): Branch[]` |
| `src/llm/query-evidence-pack.ts` (mới) | `QueryEvidencePack`, `buildQueryEvidencePack()`, tái dùng helper từ `evidence-pack.ts` |
| `src/llm/query-prompt.ts` (mới) | `QUERY_SYSTEM_PROMPT`, `buildQueryUserMessage()` |
| `src/llm/query.ts` (mới) | `generateDomainQuery()` — orchestrator |
| `src/server/routes.ts` (sửa) | Thêm `POST /charts/query` |
| `src/llm/evidence-pack.ts` | **KHÔNG sửa** — có thể export thêm helper nếu cần tái dùng, nhưng không đổi `EvidencePack`/`buildEvidencePack()` hiện có |

## 8. Known Issues / chưa xử lý

- **Case biên: domain trả về 1 cung nhưng cung đó KHÔNG có Rule nào matched ở bất kỳ scope
  nào.** `interpretation_groups` sẽ có các `scope` với `items: []`. Cần quyết định lúc viết
  plan: có nên lược bỏ hẳn 1 `scope` khỏi mảng nếu `items` rỗng (giảm nhiễu cho LLM), hay giữ
  nguyên với `items: []` (rõ ràng "đã kiểm tra, không có gì" thay vì im lặng bỏ qua)? Nghiêng
  về giữ `items: []` — nhất quán "fail loud"/không âm thầm bỏ qua, nhưng cần xác nhận lúc viết
  plan, không tự quyết ở đây.
- **NLU (câu hỏi tự nhiên → domain)** — phase riêng sau này, không nằm trong v0.1. Ghi chú ở
  đây để không trôi mất (CLAUDE.md mục 10).
- **`DOMAIN_PALACE_MAP`'s `palace_names` cụ thể (chuỗi tiếng Việt) cần khớp CHÍNH XÁC giá trị
  thật `ChartPalace.palace_name` sinh ra từ `iztro`** — cần verify bằng dữ liệu thật (build
  chart mẫu, đọc `chart.palaces[].palace_name`) khi viết plan, KHÔNG gõ theo trí nhớ (đúng
  CLAUDE.md mục 6 — đã có tiền lệ lỗi loại này với tên cung Tử Tức/Tử Nữ trong session trước).
- **Domain `phu_mau`/`phu_the` là tranh_cai ở CHÍNH việc "cung nào liên quan"** (không phải
  tranh cãi về nội dung luận giải như Rule thông thường) — cần xác nhận cách diễn đạt trong
  response khi 1 domain trả nhiều cung: có cần LLM tự nói rõ "trường phái khác nhau xem thêm
  cung X" không, hay chỉ cần trình bày cả 2 cung mà không giải thích lý do? Để ngỏ, quyết định
  lúc viết prompt chi tiết trong implementation plan.
