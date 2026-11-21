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
