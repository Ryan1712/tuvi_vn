# Đổi `algorithm` mặc định của `iztro` sang `zhongzhou` — Design Doc

## 0. Bối cảnh

Phát hiện khi dựng 1 mockup UI (không phải trong lúc làm Chart Engine): điều tra sâu (đọc thẳng
source code `iztro`, chạy thật, so với reference #1 — ảnh tuvi.vn, case Phạm Duy) cho thấy
`algorithm: 'zhongzhou'` khớp reference #1 **nhiều hơn** `algorithm: 'default'` (mặc định hiện
tại của thư viện, dự án chưa từng chủ động chọn ở đâu trong code) ở ít nhất 5 điểm cụ thể, và
**không kém hơn ở bất kỳ điểm nào đã kiểm tra qua toàn bộ 12 cung**:

| Field | `default` | `zhongzhou` | Ai khớp reference #1? |
|---|---|---|---|
| Chủ mệnh (`soul`) | Cự Môn | **Lộc Tồn** | `zhongzhou` |
| Hợi: Kiếp Sát | thiếu | **có** | `zhongzhou` |
| Dậu: Long Đức | thiếu | **có** | `zhongzhou` |
| Thân: nhãn `suiqian12` | Đại Hao | **Tuế Phá** | `zhongzhou` |
| Sửu: "Không Vong" thừa | có (ref không có) | không có | `zhongzhou` |
| Vị trí + tên chính tinh (12 cung) | 12/12 khớp | 12/12 khớp | ngang nhau |
| Độ sáng chính tinh | 3/14 khớp | 3/14 khớp | ngang nhau (xem mục 3) |
| Thiên Khôi | Sửu | Sửu | ngang nhau (cả 2 đều lệch ref — xem mục 3) |
| Thiên Thương/Thiên Sứ | Thìn/Ngọ | Thìn/Ngọ | ngang nhau (đều khớp ref) |

Đây khớp lại đúng quyết định nền tảng đầu tiên của dự án (`TuVi_Build_Spec_v1.md` dòng 44:
"Lớp suy luận sâu (logic cách cục): Trung Châu phái") — quyết định đó nói về tầng LUẬN GIẢI
(Rule Engine), nhưng `algorithm` của `iztro` lại là tầng TÍNH TOÁN vị trí sao. `zhongzhou` khớp
đúng công thức Trung Châu phái ở tầng tính toán tốt hơn `default` — 2 tầng khác nhau, cùng
hướng về 1 trường phái nền tảng.

**Quyết định cũ (2026-08-18, `docs/superpowers/specs/2026-08-18-ui-design.md` dòng 24-32) đã
giữ `default`** — nhưng dựa trên tiêu chí hẹp: "algorithm nào giải quyết được lệch Thiên Khôi".
Kết quả: không cái nào giải quyết được (Thiên Khôi độc lập hoàn toàn với `algorithm` — xem mục
3), nên quyết định cũ kết luận "không đáng đổi". Điều tra lần này (2026-08-21) mở rộng phạm vi
so sánh ra toàn bộ 12 cung thay vì chỉ 1 field (`soul`), cho thấy `zhongzhou` khớp reference #1
rộng hơn đáng kể so với những gì quyết định cũ đã thấy. Đây là lý do đặt lại câu hỏi kiến trúc —
không phải "thấy sai thì đổi cho được việc", mà dữ liệu so sánh đầy đủ hơn dẫn tới kết luận khác.

## 1. Quyết định

Đổi `algorithm` mặc định của `iztro` sang `'zhongzhou'` cho **toàn bộ dự án**, không phải tùy
chọn theo request.

### 1.1 Vì sao là hằng số toàn cục, không phải field trong `BuildChartInput`

`astro.config({ algorithm })` của `iztro` mutate **1 biến module-level nội bộ của thư viện**
(xác nhận bằng cách đọc `node_modules/iztro/lib/astro/astro.js` — hàm `config()` ghi vào biến
đóng gói `_algorithm`, không truyền qua tham số của `astro.bySolar()`/`astro.byLunar()`). Đây
KHÔNG PHẢI tham số theo từng lần gọi — gọi 1 lần sẽ ảnh hưởng **mọi lần build chart sau đó**
trong cùng tiến trình Node.

Nếu để `algorithm` là field trong `BuildChartInput` (cho phép chọn theo từng request), mỗi lần
`buildChart()` sẽ phải gọi lại `astro.config()` trước khi gọi `astro.bySolar()` — tạo rủi ro
race condition thật nếu server xử lý nhiều request đồng thời với `algorithm` khác nhau (Node
đơn luồng cho code đồng bộ, nhưng `astro.config()` + `astro.bySolar()` không được đảm bảo chạy
liền mạch không bị chen ngang bởi request khác nếu có bất kỳ `await` nào xen giữa). Dự án hiện
chỉ cần 1 trường phái duy nhất làm nền tảng (đúng định hướng ban đầu) — không có nhu cầu thật
nào cho việc chọn `algorithm` theo request. Chọn hằng số toàn cục, đơn giản, không rủi ro.

### 1.2 Ranh giới quan trọng — đây là quyết định ở tầng TÍNH TOÁN, khác tầng LUẬN GIẢI

CLAUDE.md mục 2 (ranh giới cứng) và cách Rule Engine xử lý `conflict_group_id` đã thiết lập
nguyên tắc: khi 2 nguồn tri thức mâu thuẫn ở tầng LUẬN GIẢI, giữ cả hai, không ép về 1 đáp án.
Quyết định này **KHÔNG vi phạm nguyên tắc đó** — nó áp dụng cho 1 tầng khác hoàn toàn (tầng
TÍNH TOÁN vị trí sao vật lý). Một lá số tại 1 thời điểm chỉ có thể có 1 vị trí sao vật lý (sao
không thể "vừa ở Sửu vừa ở Hợi" cùng lúc để giữ trung lập giữa 2 trường phái) — khác bản chất
với 1 tổ hợp sao có thể có 2 cách LUẬN GIẢI khác nhau (RULE_A/RULE_B, cùng vị trí, khác ý nghĩa).

**Ghi rõ để không ai nhầm sau này:** việc dự án "hỗ trợ đa trường phái" chỉ đúng ở tầng luận
giải (Rule Engine, Source, `conflict_group_id`) — tầng tính toán vị trí sao hard-code cứng 1
trường phái duy nhất (`zhongzhou`) cho toàn hệ thống. Nếu tương lai có nhu cầu thật hỗ trợ nhiều
trường phái TÍNH TOÁN khác nhau (không chỉ nhiều cách diễn giải trên cùng 1 kết quả tính toán),
thiết kế `astro.config()` toàn cục này sẽ cần đổi hẳn kiến trúc (VD: 2 tiến trình riêng, hoặc
build chart trong worker riêng có thể set `algorithm` độc lập) — không phải chỉnh nhỏ.

## 2. Thay đổi code

### 2.1 `src/chart/iztro-client.ts`

Thêm 1 lời gọi `astro.config({ algorithm: 'zhongzhou' })` ở **module-level** (chạy đúng 1 lần
khi module được import lần đầu, trước mọi lời gọi `astro.bySolar`/`astro.byLunar`):

**[SỬA SAU KHI USER REVIEW — claim ban đầu ở đây sai, đã tự kiểm chứng lại bằng grep thật]**
Bản nháp đầu của mục này viết "không có đường nào khác trong codebase còn gọi
`astro.bySolar`/`astro.byLunar` bỏ qua file này" — **claim đó SAI, chưa từng verify bằng
grep trước khi viết**. Grep thật (`grep -rn "astro\.bySolar\|astro\.byLunar\|from 'iztro'"
src/ test/`) cho thấy **4 chỗ trong `test/` import `astro` trực tiếp từ `iztro`, bỏ qua
`iztro-client.ts` hoàn toàn**: `test/chart/adapter.test.ts` (dòng 2, 15, 156),
`test/chart/iztro-smoke.test.ts` (dòng 2, 12, 24), `test/llm/evidence-pack.test.ts` (dòng 2,
21). Đây đúng là rủi ro đã cảnh báo ở mục 3 ("1 file khác import iztro trực tiếp, bỏ qua
iztro-client.ts") — nhưng đang tồn tại THẬT trong codebase hiện tại, không phải rủi ro giả
định tương lai. Xem Task bổ sung ở implementation plan: các file test này phải đổi sang gọi
qua `callIztro()`/`buildChart()` (từ `iztro-client.ts`/`index.ts`) thay vì tự import `astro`
trực tiếp — nếu không, chúng sẽ chạy với `algorithm` mặc định của `iztro` (KHÔNG PHẢI
`zhongzhou`) bất cứ khi nào Vitest chạy file đó trước khi `iztro-client.ts` được import lần
đầu trong cùng tiến trình (thứ tự chạy file của Vitest không đảm bảo, có thể chạy song song).

```ts
import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { BuildChartInput } from './types.js';

/**
 * Chon algorithm 'zhongzhou' (Trung Chau phai) lam MAC DINH TOAN CUC cho toan bo du an —
 * khop dung dinh huong nen tang da chon tu dau (TuVi_Build_Spec_v1.md: "lop suy luan sau:
 * Trung Chau phai"). Xem design doc 2026-08-21-algorithm-zhongzhou-design.md muc 1 ve ly do
 * chon global constant thay vi field trong BuildChartInput, va muc 1.2 ve ranh gioi giua
 * quyet dinh nay (tang TINH TOAN, 1 trường phai duy nhat) va cach Rule Engine xu ly da
 * trường phai o tang LUAN GIAI (giu ca 2 qua conflict_group_id, khong chon phe).
 *
 * QUAN TRONG: astro.config() mutate 1 bien module-level NOI BO cua iztro, khong phai tham
 * so truyen theo tung lan goi bySolar/byLunar — goi 1 LAN o day, KHONG goi lai o bat ky
 * dau khac trong codebase (se lam thay doi ngam ket qua cua MOI lan build chart sau do).
 */
astro.config({ algorithm: 'zhongzhou' });

/** Gioi tinh cua du an -> gioi tinh cua iztro. */
function toIztroGender(gender: 'nam' | 'nu'): 'male' | 'female' {
  return gender === 'nam' ? 'male' : 'female';
}

// ... phan con lai cua file giu nguyen khong doi ...
```

### 2.2 KHÔNG thêm field `algorithm` vào `BuildChartInput`/`Chart`/`EngineMeta`

Theo mục 1.1 — không có nhu cầu chọn theo request. `EngineMeta` (hiện chỉ có
`engine`/`engine_version`/`language`/`notes`) không cần field `school_used` mới cho việc này;
build spec mục 82 có nhắc `school_used` nhưng đó nói về Rule/Source (luận giải), không phải
`algorithm` (tính toán) — không lẫn 2 khái niệm. Ghi 1 dòng vào `notes` của `engine_meta` (đã
có tiền lệ dùng `notes` để ghi các quyết định ngầm không có field riêng — xem `adapter.ts`
dòng 146-153) để không ai đọc `Chart` output mà không biết đang chạy trường phái nào:

```ts
const notes: string[] = [
  'Do sang giu nguyen thang 7 muc cua iztro (Mieu/Vuong/Dac/Loi/Binh/Bat/Han), khong rut ve 5 muc.',
  'Nap am lay tu lunar-typescript vi iztro khong cung cap.',
  'Tuan/Triet nam trong adjective_stars (TUAN_KHONG / TRIET_LO / KHONG_VONG), khong phai truong rieng.',
  'luu_nien CO CHU DICH khong nam trong Chart: no la du lieu theo nam duoc hoi, khong phai fact tinh cua la so. Dung astrolabe.horoscope(date) khi can.',
  'algorithm: zhongzhou (Trung Chau phai) — cau hinh toan cuc tai iztro-client.ts, xem design doc 2026-08-21-algorithm-zhongzhou-design.md.',
];
```

## 3. Test khóa hành vi (bắt buộc — không phải tùy chọn)

**Chốt rõ, không để "hoặc" trôi vào implementation:** test khóa hành vi PHẢI kiểm tra qua
**runtime behavior**, không dừng ở kiểm tra tĩnh (grep source tìm chuỗi `astro.config`). Lý do:
grep chỉ phát hiện được nếu ai đó gõ thêm 1 lời gọi MỚI trong code hiện tại — không bắt được
rủi ro thật của global mutable state: 1 file khác import `iztro` trực tiếp (bỏ qua
`iztro-client.ts`) rồi tự gọi `astro.config()` với giá trị khác ở đâu đó, hoặc state bị lệch
giữa các lần build khác nhau trong cùng 1 tiến trình chạy lâu (server). Grep tĩnh không xác
nhận được "kết quả build có nhất quán qua nhiều lần gọi hay không" — chỉ test hành vi thật mới
xác nhận được điều đó.

**Test cụ thể** (thêm vào `test/chart/adapter.test.ts` hoặc file test mới `test/chart/
algorithm-config.test.ts`):

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

const OTHER_CASE: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1990-06-15',
  time_index: 6,
  gender: 'nu',
  fix_leap: true,
};

describe('algorithm: zhongzhou — global config nhat quan qua nhieu lan build', () => {
  it('build xen ke 2 case khac nhau nhieu lan, moi lan deu ra dung gia tri zhongzhou da biet truoc', () => {
    // Ca 2 gia tri ky vong (Pham Duy: Loc Ton; OTHER_CASE: <dien vao sau khi chay
    // buildChart() that voi zhongzhou da bat — xem ghi chu implementer ben duoi) DA
    // duoc xac dinh truoc khi viet test nay, KHONG phai suy ra tu ket qua cua chinh
    // test — day la diem khac voi mot ban nhap truoc do dung toBeTruthy() (guard yeu,
    // khong phan biet duoc voi ket qua cua algorithm default).
    const PHAM_DUY_SOUL = 'Lộc Tồn';
    const OTHER_CASE_SOUL = 'Phá Quân';

    const chart1 = buildChart(PHAM_DUY);
    expect(chart1.menh_than.soul_star).toBe(PHAM_DUY_SOUL);

    const chart2 = buildChart(OTHER_CASE);
    expect(chart2.menh_than.soul_star).toBe(OTHER_CASE_SOUL);

    // Build lai CA 2 case LAN NUA, dao thu tu — xac nhan ket qua GIONG HET lan dau,
    // khong bi "troi" theo thu tu goi hay so lan build truoc do. Day la phan quan
    // trong nhat cua test: neu global state bi mat hieu luc/bi ghi de o dau do, day
    // la buoc se bat duoc, khong phai 2 assert dau (chi build 1 lan/case khong du de
    // phat hien loi tich luy qua nhieu lan goi).
    const chart2Again = buildChart(OTHER_CASE);
    expect(chart2Again.menh_than.soul_star).toBe(OTHER_CASE_SOUL);
    const chart1Again = buildChart(PHAM_DUY);
    expect(chart1Again.menh_than.soul_star).toBe(PHAM_DUY_SOUL);
  });

  it('engine_meta.notes ghi ro dang dung algorithm zhongzhou', () => {
    const chart = buildChart(PHAM_DUY);
    expect(chart.engine_meta.notes.some((n) => n.includes('zhongzhou'))).toBe(true);
  });
});
```

**Giá trị đã verify sẵn khi viết design doc này** (chạy trực tiếp `astro.config({algorithm:
'zhongzhou'}); astro.bySolar(...)` cho cả 2 case, không đoán): `PHAM_DUY_SOUL = 'Lộc Tồn'`,
`OTHER_CASE_SOUL = 'Phá Quân'`. Cả 2 literal trong code mẫu ở trên đã là giá trị thật, dùng
trực tiếp — implementer KHÔNG cần tự chạy lại để lấy giá trị, chỉ cần re-run test sau khi
implement Task 1 để xác nhận khớp (nếu không khớp, đó là tín hiệu có gì đó sai trong lúc thêm
`astro.config()`, cần điều tra trước khi tiếp tục, không tự sửa giá trị test cho khớp).

## 4. Cập nhật test suite hiện có (bắt buộc, giá trị cụ thể, không nới lỏng assertion)

Rà toàn bộ test hiện có, tìm assertion phụ thuộc field bị `algorithm` ảnh hưởng:
`menh_than.soul_star`, `adjective_stars` (1 số tạp diệu bị thêm/bớt), `suiqian` (1 nhãn tại 1
vị trí cụ thể). Với MỖI assertion cần sửa: chạy `buildChart()` thật (sau khi đã đổi config) để
lấy giá trị mới, KHÔNG gõ theo trí nhớ "nghe có vẻ đúng theo zhongzhou". Test vẫn phải assert
giá trị CỤ THỂ (VD `expect(soul_star).toBe('Lộc Tồn')`) — **không được nới lỏng thành assertion
chung chung** (VD `toBeDefined()`) chỉ để làm test pass trở lại. Đây là loại "guard giả" đã bị
bắt 2 lần trong Rule Engine v0.2/v0.3 — không lặp lại ở đây.

File cần rà (danh sách khởi điểm, implementer cần tự `grep` lại để không bỏ sót — không tin
danh sách này là đầy đủ 100%):
- `test/chart/adapter.test.ts`
- `test/chart/pham-duy-crosscheck.test.ts`
- `test/server/routes.test.ts` (assertion nào tham chiếu `soul_star`/tạp diệu cụ thể)
- Bất kỳ file test nào khác `grep -rn "soul_star\|Cự Môn" test/` tìm thấy còn sót.

## 5. Cập nhật design doc gốc — đóng Known Issues đã lỗi thời

`docs/superpowers/specs/2026-08-16-chart-engine-design.md` mục 7 hiện phân loại các điểm lệch
dựa trên dữ liệu build với `algorithm: 'default'`. Sau khi đổi sang `zhongzhou`, các điểm sau
**không còn là "khác trường phái hợp lệ, giữ nguyên"** — chúng đã khớp reference #1, cần cập
nhật trạng thái:
- Chủ mệnh (`soul`): Cự Môn → **Lộc Tồn**, khớp ref.
- Hợi: **thêm Kiếp Sát** (trước thiếu).
- Dậu: **thêm Long Đức** (trước thiếu).
- Thân: nhãn `suiqian12` Đại Hao → **Tuế Phá**, khớp ref.
- Sửu: "Không Vong" (trước dư thừa so với ref) → không còn xuất hiện.

**2 nhóm lệch còn tồn tại thật, KHÔNG do quyết định này** — giữ nguyên trạng thái Known Issue,
không đóng:
1. **Thiên Khôi** (Sửu vs ref: Hợi) — đã xác nhận 2 lần độc lập (đọc thẳng source
   `getKuiYueIndex()` trong `node_modules/iztro/lib/star/location.js`): hàm chỉ nhận Thiên Can
   năm sinh, không đọc `algorithm`. Công thức khác tầng hoàn toàn, không liên quan quyết định
   này.
2. **Độ sáng chính tinh (thang 7 mức `iztro` vs 5 mức chú thích ảnh gốc)** — đã đóng từ trước
   (CLAUDE.md mục 3, design doc mục 3), không có phép quy đổi trung lập giữa 2 thang, giữ
   nguyên nhóm 2 (khác trường phái/quy ước hiển thị hợp lệ).

Cập nhật đoạn văn bản mục 7 để phản ánh đúng: bảng đối chiếu đã đổi vì code đã đổi, không phải
vì đổi ý phân loại — ghi rõ ngày đổi (2026-08-21) và tham chiếu tới design doc này.

## 6. Ngoài phạm vi (không làm ở phase này)

- **Mockup/UI**: mockup Tử Vi đang làm dở ở 1 cuộc trò chuyện khác — KHÔNG động vào ở phase
  này. Tách riêng, đúng nguyên tắc "tầng kỹ thuật nền tảng" (rủi ro hồi quy) vs "tầng trình
  bày" (rủi ro thiết kế) không nên gộp — nếu phát hiện vấn đề sau này, cần biết ngay đó là lỗi
  đổi `algorithm` hay lỗi thiết kế UI, không lẫn lộn. Sau khi phase này xong, build lại mockup
  với dữ liệu `zhongzhou` mới.
- **Bảng ngũ hành riêng cho từng sao** (khác `branch_element` ở cấp cung) — phát hiện lúc dựng
  mockup: `iztro` không cung cấp field này ở cấp độ sao. Nếu cần, đây là 1 bảng tri thức tĩnh
  mới, phải qua đúng quy trình verify nguồn (không suy luận từ kiến thức Tử Vi phổ thông) —
  việc riêng, không thuộc phase này.
- **Tuần/Triệt vị trí chính xác** — Known Issue cũ (design doc gốc mục 6) vẫn treo, không liên
  quan quyết định `algorithm`.
