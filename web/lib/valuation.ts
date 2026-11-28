// 주가 수준 PER·PBR 화면 행 계산 (PRD 4장 F-09, FS 6-x·9-3). 화면 없이 값·문구 선택만 한다.
// 값을 평가하는 판정은 하지 않는다. 업종 가운데 값과의 비교는 F-08 compareToIndustry를 그대로 쓰되 relation은 쓰지 않는다 (FS 6-8)
import { copy } from '@/lib/copy';
import { formatMultiple } from '@/lib/format';
import type { ValuationGaugeKey } from '@/lib/gauge';
import { compareToIndustry, type IndustryCompare, type IndustryMedian } from '@/lib/industry';

// v_valuation 한 행 (FS 4-1 4번). per·pbr은 DB가 계산해 준 값이고, null이면 계산하지 않은 것 (적자·자본잠식)
export interface StockValuation {
  // 주가 기준일 (YYYY-MM-DD, 화면에 그대로 쓴다)
  basDt: string;
  // 순이익·자본을 가져온 최신 사업연도
  latestYear: number;
  per: number | null;
  pbr: number | null;
}

// 업종 가운데 값 중 PER·PBR 두 개만 쓴다 (FS 4-1 5번). 업종이 없으면 null
export interface ValuationMedians {
  per: IndustryMedian;
  pbr: IndustryMedian;
}

// 화면에 그릴 지표 한 줄 (PER 또는 PBR)
export interface ValuationRow {
  key: ValuationGaugeKey;
  title: string;
  tip: string;
  name: string;
  // 값이 없으면 null. 이때 notice가 눈금을 대신한다
  value: number | null;
  valueText: string | null;
  notice: string | null;
  // 눈금 아래 가운데 값 줄에 쓴다. 값이 없으면 그리지 않는다 (FS 9-2 규칙과 같음)
  // compare의 relation(높아/낮아/같아)은 F-09에서 쓰지 않는다 (FS 6-8·9-3, 12장 동작 기본안 1번). 화면은 kind·median·n만 본다
  compare: IndustryCompare;
  lineTip: string | null;
}

/** 영역 제목 오른쪽 기준일 문구 (PRD 4장 F-09 표 "기준일"). */
export function valuationBasisText(valuation: StockValuation): string {
  return copy.valuation.basis(valuation.basDt, valuation.latestYear);
}

/** PER·PBR 행 3줄째 왼쪽의 기준일·보통주 안내 (DESIGN-V2 2-2-3). */
export function valuationRowNoteText(valuation: StockValuation): string {
  return `${valuationBasisText(valuation)} · ${copy.valuation.commonShareNote}`;
}

/**
 * PER·PBR 두 줄을 만든다. valuation이 null이면 호출하지 않는다 (영역이 "주가 정보가 없어."를 대신 그린다).
 * medians가 null이면 업종 없음이다 (가운데 값 없이 값과 안내만 남는다).
 */
export function buildValuationRows(valuation: StockValuation, medians: ValuationMedians | null): ValuationRow[] {
  return [
    buildRow('per', valuation.per, medians?.per ?? null, null),
    buildRow('pbr', valuation.pbr, medians?.pbr ?? null, copy.valuation.pbrLineTip),
  ];
}

function buildRow(
  key: ValuationGaugeKey,
  value: number | null,
  median: IndustryMedian | null,
  lineTip: string | null
): ValuationRow {
  const metric = copy.valuation.metric[key];
  // 업종 없음이면 median이 null이라 compareToIndustry가 no_industry를 돌려준다
  const compare = compareToIndustry(value, median?.value ?? null, median?.n ?? 0, median !== null);
  return {
    key,
    title: metric.title,
    tip: metric.tip,
    name: metric.name,
    value,
    valueText: value === null ? null : formatMultiple(value),
    notice: value === null ? metric.noValue : null,
    compare,
    lineTip,
  };
}

