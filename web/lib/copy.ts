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
    // 카드 제목 (화면 문구 미정, 기본안: PRD 4장 F-05 이름)
    title: '재무 리포트카드',
    // PRD 4장 F-05 구성 2번 "눈여겨볼 변화"
    insightTitle: '눈여겨볼 변화',
    // 지표 3개: 질문형 제목 + 지표 이름 (PRD 4장 F-05 표)
    metric: {
      debt_ratio: { question: '빚이 얼마나 있나', name: '부채비율' },
      operating_margin: { question: '팔아서 얼마나 남기나', name: '영업이익률' },
      revenue_growth: { question: '매출이 얼마나 늘었나', name: '매출 증가율' },
    },
    // 눈금 기준선 툴팁 (PRD 4장 F-05 표)
    lineTip: {
      debt_ratio: '빚과 자기 돈(자본)이 같아지는 지점이야. 좋고 나쁨을 가르는 기준은 아니야.',
      operating_margin: '이 선보다 아래면 영업적자야.',
      revenue_growth: '이 선보다 아래면 매출이 전년보다 줄었어.',
    },
    // 눈금 관련 작은 문구 (Gauge)
    gauge: {
      // 눈금 끝 표시: `범위 0%~300%`
      range: (min: string, max: string) => `범위 ${min}~${max}`,
      // 눈금 aria-label: `부채비율 87.3%, 범위 0%~300%` (FS 7장)
      ariaLabel: (name: string, valueText: string, range: string) => `${name} ${valueText}, ${range}`,
      outOfRange: '눈금 범위를 벗어난 값',
    },
    // 툴팁 열기 버튼 (보이지 않는 글자, 스크린 리더용)
    tipButtonLabel: '설명 보기',
    // 값 계산 불가 칸 (PRD 4장 F-05 "계산할 수 없어")
    noCalc: '계산할 수 없어',
    // 눈금 대신 쓰는 사유 문장 (PRD 4장 F-05 표, FS 8-2). 부채비율은 자본잠식 상자가 맡는다
    unavailable: {
      debt_ratio: '자본총계가 0 이하라서 부채비율을 계산할 수 없어.',
      operating_margin: '매출액이 없어서 영업이익률을 계산할 수 없어.',
      revenue_growth: '계산할 수 없어.',
    },
    // 자본잠식 안내 (PRD 4장 F-05 표)
    capital: {
      full: '자본총계가 0 이하야 (완전 자본잠식). 회사가 가진 자산보다 빚이 더 많은 상태야.',
      partial: '자본총계가 자본금보다 적어 (부분 자본잠식).',
    },
    // 방향 화살표 옆 말 (lib/trend.ts)
    trend: {
      flat: '비슷한 수준',
      risingYears: '3년째 증가',
      fallingYears: '3년째 감소',
      mixed: '오르내림',
      risingYear: '전년보다 증가',
      fallingYear: '전년보다 감소',
      // "비슷한 수준" 툴팁 (PRD 4장 F-05)
      flatTip: '3년 동안 변화가 아주 작아서 거의 그대로야.',
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
  // 스크리너 (PRD 4장 F-07, F-03, 10장 11번). FS 12장 4번: 제목은 메뉴 이름과 같다
  screener: {
    title: '조건으로 찾기',
    // 필터를 하나도 안 골랐을 때 (PRD 10장 11번 기본안, 반말 확정 전)
    noFilter: '필터를 골라 봐.',
    // 필터 3개 초과 (PRD 4장 F-07)
    max: '필터는 3개까지 고를 수 있어',
    // 부딪히는 필터 (PRD 4장 F-07, 따옴표 안은 짝 필터 문구)
    conflict: (label: string) => `'${label}'와 함께 고를 수 없어`,
    // 고른 필터 칩 빼기 버튼 (스크린 리더용)
    removeChip: (label: string) => `${label} 빼기`,
    // 결과 수 줄 (PRD 4장 F-07)
    // FS 6-7 기본안 그대로 (천 단위 쉼표 없음)
    count: (n: number) => `조건에 맞는 회사 ${n}개`,
    // 0건 (PRD 4장 F-07)
    zero: '조건에 모두 맞는 회사가 없어. 필터를 하나 빼 봐.',
    // 금융회사 빠짐 안내와 툴팁 (PRD 4장 F-07)
    financialBlocked: '금융회사는 이 조건을 계산할 수 없어서 빠졌어.',
    financialBlockedTip:
      '금융회사는 매출액 항목이 없고, 예금이 부채로 잡혀서 부채비율을 일반 회사와 견줄 수 없어.',
    // 기준 표시 (PRD 4장 F-07)
    basis: (basDt: string) => `시가총액은 보통주 기준, 주가 ${basDt} 기준`,
    // 시가총액 열 제목 (정렬 버튼 글자)
    marketCap: '시가총액',
    name: '종목명',
    code: '종목코드',
    market: '시장',
    // 표 설명 (스크린 리더용)
    tableCaption: '조건에 맞는 회사 목록',
    // 쪽당 개수 상자 (PRD 4장 F-07: 10 / 20 / 50)
    sizeLabel: '한 번에',
    sizeOption: (n: number) => `${n}개씩`,
    // 쪽 번호 (접근성 이름)
    pageLabel: '페이지',
    prevPage: '이전 페이지',
    nextPage: '다음 페이지',
    // 로딩 중 표 위 자리 안내 (스크린 리더용)
    loading: '결과를 불러오는 중이야',
  },
  // DB 오류 공통 (PRD 10장 20번 기본안, 사용자 확인 필요). 종목 화면 오류도 이 문구를 쓴다
  dbError: '지금은 정보를 불러올 수 없어. 잠시 뒤 다시 열어 줘.',
  // 문구 미정: 종목 주소가 아닌 없는 주소(404)용. PRD·FS에 문구가 없어 임시 문장을 쓴다
  notFoundPage: '이 페이지를 찾을 수 없어.',
  // 첫 화면 종목 검색 (PRD 4장 F-01, 3-5, FS 12장 3번)
  search: {
    label: '종목 검색', // 화면에 안 보이는 라벨 (스크린 리더용)
    placeholder: '종목명이나 종목코드', // FS 12장 3번 검색창 안내 글
    listLabel: '연관검색어', // 목록 이름 (스크린 리더용, 기본안)
    foreign: '지원하지 않음', // PRD 4장 F-01 외국회사
    noResult: '검색 결과가 없어', // PRD 4장 F-01
    hint: '어떤 회사를 찾을지 모르겠다면 →', // PRD 3-5 첫 화면 바로가기 (링크는 nav.screener)
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
