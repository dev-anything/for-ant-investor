// 업종 가운데 값 비교 (PRD 4장 F-08, FS 6-8). 화면 없이 판정만 한다.
// 가운데 값(중앙값)은 DB 뷰 v_industry_medians가 계산한 값을 그대로 읽는다. 여기서 다시 계산하지 않는다 (FS 1장).

// PRD 4장 F-08 최소 회사 수 (대체안 5개). 이보다 적으면 가운데 값을 보여 주지 않는다
export const MIN_INDUSTRY_COUNT = 3;

// 업종 지표 하나의 가운데 값. value가 null이면 그 지표를 가진 회사가 없다는 뜻
export interface IndustryMedian {
  value: number | null;
  n: number;
}

export type IndustryCompare =
  // 업종 코드·이름이 없는 회사 (PRD 4장 F-08 "업종 정보가 없어.")
  | { kind: 'no_industry' }
  // 회사 수가 적거나 가운데 값이 없음 (PRD 4장 F-08 "같은 업종 회사가 적어서…")
  | { kind: 'too_few' }
  // 비교 가능. relation은 화면 표시 값(소수 1자리)끼리 비교한 결과, 이 회사 값이 없으면 null
  | { kind: 'ok'; median: number; n: number; relation: 'higher' | 'lower' | 'same' | null };

/** 화면에 찍는 소수 1자리 값으로 맞춘다 (formatPercent의 toFixed(1)과 같은 자리). */
function toDisplayValue(v: number): number {
  return Number(v.toFixed(1));
}

/**
 * 이 회사 지표 값을 같은 업종 가운데 값과 견준다.
 * hasIndustry가 false면 업종 없음, 가운데 값이 없거나 회사 수가 MIN_INDUSTRY_COUNT 미만이면 회사 적음.
 */
export function compareToIndustry(
  value: number | null,
  median: number | null,
  n: number,
  hasIndustry: boolean
): IndustryCompare {
  if (!hasIndustry) return { kind: 'no_industry' };
  if (median === null || n < MIN_INDUSTRY_COUNT) return { kind: 'too_few' };

  // 이 회사 값이 없으면 비교 줄을 쓰지 않는다 (가운데 값 표시만 남김)
  if (value === null) return { kind: 'ok', median, n, relation: null };

  const shown = toDisplayValue(value);
  const shownMedian = toDisplayValue(median);
  let relation: 'higher' | 'lower' | 'same';
  if (shown > shownMedian) relation = 'higher';
  else if (shown < shownMedian) relation = 'lower';
  else relation = 'same';

  return { kind: 'ok', median, n, relation };
}

// 업종 목록 한 중분류 (PRD 4장 F-15). 이름은 DB 표기 그대로 (줄이거나 바꾸지 않음)
export interface IndustryDivisionItem {
  divisionCode: string;
  divisionName: string;
  companyCount: number;
}

// 업종 목록 한 대분류. 회사 수는 중분류 합계다 (FS 5-3: 대분류 회사 수는 앱이 합친다)
export interface IndustrySection {
  sectionCode: string;
  sectionName: string;
  companyCount: number;
  divisions: IndustryDivisionItem[];
}

// 업종 트리 행 (FS 5-3 반환 열). lib/data/industry.ts의 IndustryTreeRow와 같은 모양
export interface IndustryTreeInput {
  sectionCode: string;
  sectionName: string;
  sectionOrder: number;
  divisionCode: string;
  divisionName: string;
  divisionOrder: number;
  companyCount: number;
}

/**
 * 중분류 행을 대분류별로 묶는다 (PRD 4장 F-15: 대분류·중분류 모두 분류 번호순).
 * 입력 순서와 관계없이 sectionOrder → divisionOrder로 정렬한다. 원본 배열은 바꾸지 않는다.
 */
export function groupIndustryTree(rows: readonly IndustryTreeInput[]): IndustrySection[] {
  const sorted = [...rows].sort(
    (a, b) => a.sectionOrder - b.sectionOrder || a.divisionOrder - b.divisionOrder
  );
  const sections: IndustrySection[] = [];
  const bySection = new Map<string, IndustrySection>();
  for (const row of sorted) {
    let section = bySection.get(row.sectionCode);
    if (section === undefined) {
      section = { sectionCode: row.sectionCode, sectionName: row.sectionName, companyCount: 0, divisions: [] };
      bySection.set(row.sectionCode, section);
      sections.push(section);
    }
    section.companyCount += row.companyCount;
    section.divisions.push({
      divisionCode: row.divisionCode,
      divisionName: row.divisionName,
      companyCount: row.companyCount,
    });
  }
  return sections;
}

// 업종 카드 회사 한 줄 (FS 5-9 반환 열). rank는 1부터, shortCode는 A 없는 표시용 종목코드
export interface IndustryTopCompany {
  divisionCode: string;
  rank: number;
  shortCode: string;
  name: string;
}

/**
 * FS 5-9 결과를 중분류 코드별로 묶는다 (rank순). 시가총액 큰 순서만 담고 평가하는 말은 붙이지 않는다 (DESIGN-V2 3-1).
 * RPC가 이미 순서를 주지만 입력 순서에 기대지 않고 rank로 다시 정렬한다.
 */
export function groupTopCompanies(rows: readonly IndustryTopCompany[]): Map<string, IndustryTopCompany[]> {
  const grouped = new Map<string, IndustryTopCompany[]>();
  for (const row of rows) {
    const list = grouped.get(row.divisionCode);
    if (list === undefined) grouped.set(row.divisionCode, [row]);
    else list.push(row);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  }
  return grouped;
}

/** 중분류의 회사 목록. 없으면 빈 배열 (DESIGN-V2 3-1: 회사가 0개면 카드에 줄을 그리지 않는다). */
export function topCompaniesFor(
  grouped: ReadonlyMap<string, readonly IndustryTopCompany[]>,
  divisionCode: string
): readonly IndustryTopCompany[] {
  return grouped.get(divisionCode) ?? [];
}

// 업종 카드 한 중분류. 회사 이름 줄은 시가총액 큰 순서 (DESIGN-V2 3-1)
export interface IndustryCardDivision extends IndustryDivisionItem {
  companyNames: string[];
}

// 업종 카드 한 대분류. divisions만 회사 이름 줄이 붙은 모양으로 바꾼다
export interface IndustryCardSection extends Omit<IndustrySection, 'divisions'> {
  divisions: IndustryCardDivision[];
}

/**
 * 업종 트리에 상위 회사 결과를 division_code로 붙인다 (FS 9-7, DESIGN-V2 3-1).
 * 회사가 없으면 빈 배열이라 카드에 회사 줄을 그리지 않는다. 원본은 바꾸지 않는다.
 */
export function attachTopCompanies(
  sections: readonly IndustrySection[],
  grouped: ReadonlyMap<string, readonly IndustryTopCompany[]>
): IndustryCardSection[] {
  return sections.map((section) => ({
    ...section,
    divisions: section.divisions.map((division) => ({
      ...division,
      companyNames: topCompaniesFor(grouped, division.divisionCode).map((company) => company.name),
    })),
  }));
}

// 업종 회사 목록 한 행 (FS 5-4 반환 열). DB 컬럼 snake_case는 여기서 camelCase로 한 번만 바꾼다
// 주가·PER·PBR·최신 연도 매출액·영업이익은 2026-11-28 사용자 지시로 추가된 열이다.
export interface IndustryCompanyRow {
  shortCode: string;
  name: string;
  market: string | null;
  accMt: string | null;
  marketCap: number | null;
  basDt: string | null;
  price: number | null;
  per: number | null;
  pbr: number | null;
  fiscalYear: number | null;
  revenue: number | null;
  operatingIncome: number | null;
  isFinancial: boolean | null;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/**
 * industry_companies RPC 한 행을 화면용 행으로 바꾼다 (FS 5-4).
 * total_count는 모든 행에 같은 값이라 첫 행에서 읽는다. 필수 열이 없으면 모양 오류로 막는다.
 */
export function mapIndustryCompanyRow(raw: unknown): { total: number; row: IndustryCompanyRow } {
  const fn = 'industry_companies';
  const r = recordOf(raw);
  if (r === null) throw new Error(`${fn} 응답 모양이 다르다 (객체가 아님)`);

  const total = r.total_count;
  const shortCode = r.short_code;
  const name = r.itms_nm;
  if (typeof total !== 'number' || !Number.isFinite(total)) {
    throw new Error(`${fn} 응답 모양이 다르다 (total_count)`);
  }
  if (typeof shortCode !== 'string' || typeof name !== 'string') {
    throw new Error(`${fn} 응답 모양이 다르다 (short_code·itms_nm)`);
  }

  return {
    total,
    row: {
      shortCode,
      name,
      market: textOrNull(r.mrkt_ctg),
      accMt: textOrNull(r.acc_mt),
      marketCap: numberOrNull(r.mrkt_tot_amt),
      basDt: textOrNull(r.bas_dt),
      price: numberOrNull(r.clpr),
      per: numberOrNull(r.per),
      pbr: numberOrNull(r.pbr),
      fiscalYear: numberOrNull(r.fiscal_year),
      revenue: numberOrNull(r.revenue),
      operatingIncome: numberOrNull(r.operating_income),
      isFinancial: booleanOrNull(r.is_financial),
    },
  };
}
