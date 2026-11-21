// 화면 문구 모음
// PRD 3-1: 용어·어투 (사용자 문구 반말, 출처·계정 존댓말)
// PRD 3-2: 출처 표시 (확정 문구)
// PRD 10장 1번: 투자 책임 고지 기본안

export const copy = {
  brand: '재무 레이더',
  nav: {
    search: '종목 검색',
    screener: '조건으로 찾기',
  },
  // 메타데이터 (서비스명 기준, 간단히)
  meta: {
    title: '재무 레이더',
    description: '재무 레이더: 종목의 최근 3개년 실적과 재무 변화를 쉽게 보여주는 웹앱',
    // FS 8-2: 종목 화면 제목 `{종목명} ({code}) · 재무 레이더`
    stockTitle: (name: string, code: string) => `${name} (${code}) · 재무 레이더`,
  },
  // 종목 화면 (PRD 3-7, 10장 18·20번, FS 12장 1·2번)
  stock: {
    // FS 12장 1번 기본안: 외국회사 (화면 볼 때 확정)
    foreign: '이 종목은 외국회사라서 재무정보를 지원하지 않아.',
    // PRD 3-7, 10장 18번: 재무 데이터 없음 (최종 확정 남음)
    noFinancials: '이 회사의 재무정보가 없어',
    // FS 12장 2번 기본안: 없는 종목 주소 (404)
    notFound: '이 종목을 찾을 수 없어. 검색에서 다시 찾아 줘.',
    // PRD 10장 20번: DB 오류 (사용자 확인 필요)
    error: '지금은 정보를 불러올 수 없어. 잠시 뒤 다시 열어 줘.',
  },
  // 실적 그래프 (PRD 4장 F-02, 3-1·3-8). 툴팁 "정식 이름은 당기순이익"은 PRD 확정 문구
  results: {
    title: '실적',
    // 실적 그래프 시각적으로 숨긴 표의 연도 열 머리글 (접근성)
    yearHeader: '사업연도',
    // FS 8-2: `기준: {formatFsDiv} · {formatYearRange} 사업연도`
    basis: (fsLabel: string, yearRange: string) => `기준: ${fsLabel} · ${yearRange} 사업연도`,
    // PRD 4장 F-02 금융회사 안내
    financialNotice: '금융회사는 매출액 항목이 없어서 영업이익과 순이익만 보여줘',
    notProvided: '제공되지 않음',
    // 툴팁 증감률 줄: `전년 대비 +12.3%`
    growth: (text: string) => `전년 대비 ${text}`,
    metricTitle: {
      revenue: '매출액',
      operatingIncome: '영업이익',
      netIncome: '순이익',
    },
    netIncomeTip: '정식 이름은 당기순이익',
    tipButtonLabel: '설명 보기',
  },
  // 리포트카드 (PRD 4장 F-05). 화살표 옆 말과 "눈여겨볼 변화" 문장 8개는 PRD 그대로 쓴다
  reportCard: {
    // 방향 화살표 옆 말 (lib/trend.ts)
    trend: {
      flat: '비슷한 수준',
      risingYears: '3년째 증가',
      fallingYears: '3년째 감소',
      mixed: '오르내림',
      risingYear: '전년보다 증가',
      fallingYear: '전년보다 감소',
    },
    // 문장 템플릿 (lib/insights.ts). id는 PRD 4장 F-05 표 번호
    insight: {
      1: '매출은 늘었는데 영업이익률은 줄었어',
      2: '매출은 줄었는데 영업이익은 늘었어',
      3: '영업이익은 흑자인데 순이익은 적자야',
      4: (year: number) => `${year}년에 영업이익이 흑자로 돌아섰어`,
      5: (year: number) => `${year}년에 영업이익이 적자로 돌아섰어`,
      6: (n: number) => `영업적자가 ${n}년째 이어지고 있어`,
      7: (prev: string, curr: string) => `부채비율이 1년 사이 ${prev}%에서 ${curr}%로 올랐어`,
      8: '영업이익은 적자인데 순이익은 흑자야',
    },
  },
  // 문구 미정: 종목 주소가 아닌 없는 주소(404)용. PRD·FS에 문구가 없어 임시 문장을 쓴다
  notFoundPage: '이 페이지를 찾을 수 없어.',
  // 임시 홈 화면 문구 (DEV_PLAN 0b, 1b에서 교체). PRD 3-1 반말
  home: {
    stockLabel: '조회 종목:',
    empty: '조회된 종목이 없어.',
  },
  footer: {
    // PRD 10장 1번: 투자 책임 고지 기본안 (화면 하단 한 줄, 존댓말)
    disclaimer: '이 서비스는 투자 권유가 아닌 참고 정보이며, 투자 판단의 책임은 본인에게 있습니다.',
    // PRD 3-2: 출처 표시 확정 문구 1행 (존댓말)
    source:
      '데이터 출처: 금융위원회·공공데이터포털(data.go.kr), 금융감독원 전자공시시스템(DART), 국가데이터처 통계분류포털 한국표준산업분류(제11차, kssc.mods.go.kr)',
    // PRD 3-2: 출처 표시 확정 문구 2행 (존댓말)
    sourceNote:
      '공시 내용의 정확성은 각 회사에 책임이 있으며, 이 서비스는 데이터를 가공해 보여줍니다.',
  },
} as const;
