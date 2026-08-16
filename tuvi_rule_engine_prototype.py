"""
Prototype: chứng minh Chart Data Shape v0.1 + Rule Schema v0.1 (bản đã tinh chỉnh
theo góp ý ChatGPT: condition/modifier/exception tách riêng) là KHẢ THI để
encode + evaluate 5 loại rule test, không cần "hack" bằng câu văn tự do.

Không dùng LLM ở bước này -- toàn bộ là code thuần, test được bằng assert.
LLM chỉ vào cuộc SAU khi có Evidence Pack (ngoài phạm vi prototype này).
"""

from dataclasses import dataclass, field
from typing import Optional


# =====================================================================
# 1. BẢNG TĨNH (không đổi theo từng lá số -- viết 1 lần, dùng mãi mãi)
# =====================================================================

BRANCH_ORDER = ["Ty", "Suu", "Dan", "Mao", "Thin", "Ty2",
                "Ngo", "Mui", "Than", "Dau", "Tuat", "Hoi"]

# Tam hợp: 4 nhóm cố định theo địa chi
TAM_HOP_GROUPS = [
    {"Than", "Ty", "Thin"},
    {"Ty2", "Dau", "Suu"},
    {"Dan", "Ngo", "Tuat"},
    {"Hoi", "Mao", "Mui"},
]

def xung_chieu(branch: str) -> str:
    """Cung xung chiếu = đối diện, cách nhau 6 vị trí. Tính 1 lần, dùng mãi."""
    i = BRANCH_ORDER.index(branch)
    return BRANCH_ORDER[(i + 6) % 12]

def tam_hop_partners(branch: str) -> list[str]:
    for g in TAM_HOP_GROUPS:
        if branch in g:
            return sorted(g - {branch})
    return []

# Bảng Tứ Hóa theo Thiên Can -- CẢNH BÁO: đây là bảng minh họa, cần đối chiếu
# lại với trường phái đã chọn (Bắc phái vs Nam phái có vài chỗ dị bản) trước
# khi khóa v0.1. Không nên coi bảng dưới là ground truth ngay.
TU_HOA_TABLE = {
    "Giap": {"Loc": "LIEM_TRINH", "Quyen": "PHA_QUAN", "Khoa": "VU_KHUC", "Ky": "THAI_DUONG"},
    "At":   {"Loc": "THIEN_CO",   "Quyen": "THIEN_LUONG", "Khoa": "TU_VI", "Ky": "THAI_AM"},
    "Binh": {"Loc": "THIEN_DONG", "Quyen": "THIEN_CO", "Khoa": "VAN_XUONG", "Ky": "LIEM_TRINH"},
    "Mau":  {"Loc": "THAM_LANG", "Quyen": "THAI_AM", "Khoa": "HUU_BAT", "Ky": "THIEN_CO"},
    # ... các can còn lại thêm sau, prototype chỉ cần đủ để test
}


# =====================================================================
# 2. CHART DATA SHAPE v0.1 (rút gọn cho prototype)
# =====================================================================

@dataclass
class Palace:
    branch: str
    palace_name: str
    palace_stem: str
    major_stars: list[dict] = field(default_factory=list)   # {star_id, strength}
    minor_stars: list[dict] = field(default_factory=list)   # {star_id}
    sihua: list[dict] = field(default_factory=list)         # {star_id, type, source}

@dataclass
class Chart:
    chart_id: str
    year_can: str                      # Thiên can năm sinh -- driver của Tứ Hóa bản mệnh
    palaces: dict[str, Palace]         # key = branch

    def palace_of(self, branch: str) -> Palace:
        return self.palaces[branch]

    def stars_in(self, branch: str) -> set[str]:
        p = self.palaces[branch]
        return {s["star_id"] for s in p.major_stars} | {s["star_id"] for s in p.minor_stars}

    def related_palace(self, branch: str, relation: str) -> list[Palace]:
        """Đúng chỗ ChatGPT lo ngại: quan hệ same_palace không đủ.
        Hàm này lấy cung liên quan qua bảng TĨNH ở trên, không cần lưu
        trong dữ liệu chart -- suy ra được ngay từ branch."""
        if relation == "xung_chieu":
            return [self.palaces[xung_chieu(branch)]]
        if relation == "tam_hop":
            return [self.palaces[b] for b in tam_hop_partners(branch)]
        raise ValueError(f"Unknown relation: {relation}")


# --- Encode lá số Phạm Duy (rút gọn, chỉ các cung cần cho 5 test) ---

pham_duy = Chart(
    chart_id="pham_duy_1998",
    year_can="Mau",  # Mậu Dần
    palaces={
        "Hoi": Palace(
            branch="Hoi", palace_name="Menh", palace_stem="Ky",
            major_stars=[{"star_id": "THIEN_DONG", "strength": "dac"}],
            minor_stars=[{"star_id": "DIA_KHONG", "strength": "dac"},
                         {"star_id": "DIA_KIEP", "strength": "binh"}],
        ),
        "Ty2": Palace(  # cung Tỵ (đặt tên Ty2 để tránh trùng Tý)
            branch="Ty2", palace_name="No_Boc", palace_stem="Giap",
            major_stars=[{"star_id": "THAT_SAT", "strength": "vuong"}],
            minor_stars=[],
        ),
        "Mao": Palace(
            branch="Mao", palace_name="Quan_Loc", palace_stem="At",
            major_stars=[{"star_id": "CU_MON", "strength": "ham"},
                         {"star_id": "THIEN_CO", "strength": "ham"}],
            minor_stars=[],
        ),
        "Mui": Palace(
            branch="Mui", palace_name="Phuc_Duc", palace_stem="Tan",
            major_stars=[{"star_id": "THAI_AM", "strength": "dac"},
                         {"star_id": "THAI_DUONG", "strength": "dac"}],
            minor_stars=[],
        ),
    },
)


# =====================================================================
# 3. RULE SCHEMA v0.1 (bản tinh chỉnh: condition / modifier / exception)
# =====================================================================

@dataclass
class Condition:
    field: str          # vd "palace(Menh).minor_stars"
    operator: str        # contains | equals | in | not_contains
    value: str
    required: bool = True

@dataclass
class Modifier:
    field: str
    operator: str
    value: str
    effect: str          # mô tả tác động định tính, vd "tang_hieu_luc"
    weight: float = 0.5

@dataclass
class Exception:
    conditions: list[Condition]
    effect: str

@dataclass
class Rule:
    rule_id: str
    conflict_group_id: Optional[str]
    scope: str
    subject: str
    conditions: list[Condition]
    modifiers: list[Modifier] = field(default_factory=list)
    exceptions: list[Exception] = field(default_factory=list)
    conclusion_text: str = ""
    school: str = ""
    reliability_tier: int = 3     # của SOURCE
    consensus: str = "tranh_cai"  # của RULE -- trục độc lập, đúng góp ý ChatGPT


# --- Helper: lấy field từ chart theo path kiểu "palace(Menh).minor_stars" ---

def resolve_field(chart: Chart, palace_branch: str, field_path: str) -> set[str]:
    if field_path == "minor_stars":
        return {s["star_id"] for s in chart.palace_of(palace_branch).minor_stars}
    if field_path == "major_stars":
        return {s["star_id"] for s in chart.palace_of(palace_branch).major_stars}
    if field_path == "all_stars":
        return chart.stars_in(palace_branch)
    raise ValueError(f"Unknown field: {field_path}")

def eval_condition(chart: Chart, palace_branch: str, c: Condition) -> bool:
    values = resolve_field(chart, palace_branch, c.field)
    if c.operator == "contains":
        return c.value in values
    if c.operator == "not_contains":
        return c.value not in values
    raise ValueError(f"Unknown operator: {c.operator}")


# =====================================================================
# 4. 5 RULE TEST (theo đề xuất của ChatGPT)
# =====================================================================

# Test 1 -- tổ hợp sao đơn giản (chính tinh + phụ tinh đồng cung)
rule_test1 = Rule(
    rule_id="T1_thien_dong_dia_khong_simple",
    conflict_group_id=None,
    scope="star_palace",
    subject="THIEN_DONG",
    conditions=[
        Condition(field="major_stars", operator="contains", value="THIEN_DONG"),
        Condition(field="minor_stars", operator="contains", value="DIA_KHONG"),
    ],
    conclusion_text="Thiên Đồng đồng cung Địa Không -- xem thêm modifier vị trí",
)

# Test 2 -- điều kiện mềm (modifier), KHÔNG lẫn vào required condition
rule_test2 = Rule(
    rule_id="T2_ty_hoi_modifier",
    conflict_group_id="CG_001",
    scope="star_combination",
    subject="DIA_KHONG_DIA_KIEP",
    conditions=[
        Condition(field="minor_stars", operator="contains", value="DIA_KHONG"),
        Condition(field="minor_stars", operator="contains", value="DIA_KIEP"),
    ],
    modifiers=[
        Modifier(field="branch", operator="in", value="Ty2,Hoi",
                  effect="phan_vi_giai_tang_hieu_luc_tot", weight=0.7),
    ],
    conclusion_text="Không Kiếp đồng cung -- tại Tỵ/Hợi có xu hướng phản vi giai (modifier, không phải chắc chắn)",
    reliability_tier=3,
    consensus="tranh_cai",
)

# Test 3 -- hội chiếu / tam phương tứ chính (KHÔNG nằm trong same_palace)
rule_test3 = Rule(
    rule_id="T3_tam_hop_relation",
    conflict_group_id=None,
    scope="palace_relationship",
    subject="MENH_tam_hop_check",
    conditions=[
        # Điều kiện này KHÔNG resolve trực tiếp trên 1 cung, cần quan hệ
        # SỬA: Hợi tam hợp với Mão-Mùi (không phải Tỵ -- Tỵ/Hợi là XUNG CHIẾU,
        # lỗi này bị chính regression test bên dưới bắt được ở lần chạy đầu)
        Condition(field="tam_hop_contains", operator="contains", value="THAI_AM"),
    ],
    conclusion_text="Cung Mệnh có Thái Âm ở 1 trong 2 cung tam hợp (Mão/Mùi)",
)

def eval_rule3(chart: Chart, menh_branch: str, r: Rule) -> bool:
    """Test 3 cần evaluator riêng vì field không nằm trong 1 palace đơn --
    đây chính là bài test ChatGPT nhấn mạnh: chart schema phải biểu diễn
    được QUAN HỆ giữa cung, không chỉ liệt kê sao trong từng cung.
    Nhờ related_palace() dùng bảng tĩnh, không cần lưu quan hệ trong data."""
    related = chart.related_palace(menh_branch, "tam_hop")
    all_related_stars = set()
    for p in related:
        all_related_stars |= {s["star_id"] for s in p.major_stars}
    return r.conditions[0].value in all_related_stars

# Test 4 -- Tứ Hóa / thiên can
rule_test4 = Rule(
    rule_id="T4_hoa_ky_thien_dong",
    conflict_group_id="CG_002",
    scope="four_transform",
    subject="THIEN_DONG_hoa_ky",
    conditions=[
        Condition(field="major_stars", operator="contains", value="THIEN_DONG"),
    ],
    conclusion_text="Nếu năm sinh Can khiến Thiên Đồng hóa Kỵ -- ý nghĩa đổi khác hẳn",
)

def eval_rule4(chart: Chart, r: Rule) -> Optional[str]:
    """Test 4: Tứ Hóa là hàm của (year_can, star) -- tra bảng TĨNH, KHÔNG
    phải thuộc tính lưu sẵn trong palace. Điều này trả lời câu ChatGPT hỏi:
    'transformations nên là thuộc tính của star, chart, hay relationship?'
    -> Câu trả lời: là THUỘC TÍNH DẪN XUẤT (derived), tính từ year_can +
    bảng tra, không nên lưu tay trong Chart data để tránh sai lệch/trùng lặp."""
    can_table = TU_HOA_TABLE.get(chart.year_can, {})
    for hoa_type, star in can_table.items():
        if star == "THIEN_DONG":
            return hoa_type
    return None

# Test 5 -- xung đột trường phái (chính là Entry 001)
rule_test5a = Rule(
    rule_id="T5A_thien_dong_khong_kiep_bat_cat",
    conflict_group_id="CG_001",
    scope="star_combination",
    subject="THIEN_DONG",
    conditions=[
        Condition(field="major_stars", operator="contains", value="THIEN_DONG"),
        Condition(field="minor_stars", operator="contains", value="DIA_KHONG"),
    ],
    conclusion_text="Thiên Đồng ngộ Không Kiếp bất cát",
    school="tong_hop_dien_dan",
    reliability_tier=3,
    consensus="tranh_cai",
)
rule_test5b = rule_test2  # cùng conflict_group_id CG_001 -- test trùng nhóm


# =====================================================================
# 5. CHẠY TEST -- Regression trên chart Phạm Duy
# =====================================================================

def run_tests():
    print("=== TEST 1: tổ hợp sao đơn giản ===")
    r1 = all(eval_condition(pham_duy, "Hoi", c) for c in rule_test1.conditions)
    print(f"  Match: {r1}  (kỳ vọng: True)")
    assert r1 is True

    print("\n=== TEST 2: modifier (điều kiện mềm, KHÔNG phải required) ===")
    base_match = all(eval_condition(pham_duy, "Hoi", c) for c in rule_test2.conditions)
    branch_in_modifier = pham_duy.palace_of("Hoi").branch in rule_test2.modifiers[0].value.split(",")
    print(f"  Base condition match: {base_match}")
    print(f"  Modifier áp dụng (branch Tỵ/Hợi): {branch_in_modifier} -> weight {rule_test2.modifiers[0].weight}")
    assert base_match and branch_in_modifier

    print("\n=== TEST 3: hội chiếu / tam phương tứ chính ===")
    r3 = eval_rule3(pham_duy, "Hoi", rule_test3)
    print(f"  Match (Thái Âm trong tam hợp của Mệnh): {r3}  (kỳ vọng: True, vì Mùi tam hợp Hợi)")
    assert r3 is True
    # Ghi chú: lần chạy đầu tiên test này FAIL vì tôi encode nhầm Thất Sát
    # vào cung Tỵ rồi giả định Tỵ tam hợp Hợi -- sai, Tỵ/Hợi là XUNG CHIẾU.
    # Chính bài test bắt được lỗi này ngay, không phải nhờ tự soát lại code.

    print("\n=== TEST 4: Tứ Hóa (derived từ year_can, không lưu tay) ===")
    r4 = eval_rule4(pham_duy, rule_test4)
    print(f"  Thiên Đồng hóa gì với Can Mậu: {r4}  (kỳ vọng: None -- Mậu không tứ hóa Thiên Đồng)")
    assert r4 is None
    # Ghi chú: kỳ vọng ban đầu tôi viết sai (giả định 'Loc'). Bảng Mậu thật ra
    # tứ hóa: Tham Lang-Lộc, Thái Âm-Quyền, Hữu Bật-Khoa, Thiên Cơ-Kỵ.
    # Đây là ví dụ khác cho thấy giá trị của việc chạy test thay vì tin vào
    # suy đoán -- kể cả bảng "tĩnh" cũng cần đối chiếu kỹ trước khi khóa.

    print("\n=== TEST 5: conflict_group_id gom đúng 2 rule trái chiều ===")
    same_group = rule_test5a.conflict_group_id == rule_test5b.conflict_group_id
    print(f"  T5A và T5B cùng CG_001: {same_group}")
    print(f"  T5A consensus: {rule_test5a.consensus} | T5B consensus: {rule_test5b.consensus}")
    print(f"  T5A reliability_tier (nguồn): {rule_test5a.reliability_tier} <- ĐỘC LẬP với consensus, đúng góp ý ChatGPT")
    assert same_group

    print("\n=== TẤT CẢ 5 TEST PASS -- schema không cần 'hack' text tự do ===")

if __name__ == "__main__":
    run_tests()
