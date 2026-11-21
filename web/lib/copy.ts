// 화면 문구 모음
// PRD 3-1: 용어·어투 (사용자 문구 반말, 출처·계정 존댓말)
// PRD 3-2: 출처 표시 (확정 문구)
// PRD 10장 1번: 투자 책임 고지 기본안

export const copy = {
  brand: '재무 레이더',
  nav: {
    search: '종목 검색',
    screener: '조건으로 찾기',
    // PRD 4장 F-15 상단 메뉴 세 번째 (2차)
    industry: '업종으로 둘러보기',
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
  // 업종 가운데 값 (PRD 4장 F-08). 평가 표현 없이 높아/낮아/같아만 쓴다
  industry: {
    // 업종 정보 없음 (리포트카드 지표 위에 한 번)
    noIndustry: '업종 정보가 없어.',
    // 지표 3개 아래 링크 (PRD 4장 F-08, FS 9-2). industry !== null일 때만 보인다
    compareLink: '같은 업종 회사 보기',
    // 눈금 아래 가운데 값 라벨: `▲ 같은 업종 가운데 값 62.0%`
    medianLabel: (valueText: string) => `같은 업종 가운데 값 ${valueText}`,
    // 가운데 값 툴팁 (PRD 4장 F-08). {N} = 이 업종 회사 수
    medianTip: (n: number) =>
      `같은 업종 회사들을 줄 세웠을 때 한가운데 값이야. 이 업종 회사 ${n}개로 계산했어.`,
    // 회사 수 부족 (PRD 4장 F-08)
    tooFew: '같은 업종 회사가 적어서 비교 값을 표시하지 않아.',
    // 같은 업종 회사 목록 (PRD 4장 F-08, FS 9-2). {N} = 회사 수
    compareTitle: (name: string, total: number) => `${name} 회사 ${total}개`,
    compareMeta: (name: string) => `${name} 지표 비교 · 재무 레이더`,
    compareCaption: '같은 업종 회사의 지표 비교 목록',
    compareColumns: {
      name: '종목명',
      code: '종목코드',
      market: '시장',
      debt: '부채비율',
      margin: '영업이익률',
      growth: '매출 증가율',
    },
    // 열 제목 연도 (`부채비율 2025년`)와 회사 연도가 다를 때 칸의 작은 표시
    yearLabel: (year: number) => `${year}년`,
    // 없는 업종 주소 (FS 12장 5번 기본안, 404)
    notFoundDivision: '이 업종을 찾을 수 없어. 업종으로 둘러보기에서 다시 찾아 줘.',
    // 비교 한 줄 (PRD 4장 F-08). 세 번째는 PRD 표기 "같아"를 조사 맞춰 쓴 문구 (문구 미정, 보고 참고)
    relation: {
      higher: '같은 업종 가운데 값보다 높아',
      lower: '같은 업종 가운데 값보다 낮아',
      same: '같은 업종 가운데 값과 같아',
    },
    // 업종으로 둘러보기 목록 (PRD 4장 F-15, FS 9-7). 분류 이름은 줄이지 않는다
    listTitle: '업종으로 둘러보기',
    listMeta: '업종으로 둘러보기 · 재무 레이더',
    listIntro: '업종을 누르면 그 업종에 속한 회사를 볼 수 있어. 업종은 한국표준산업분류(제11차) 기준이야.',
    // 이름 뒤 회사 수 `제조업 (회사 1,203개)`. 쉼표는 화면에서만 붙인다
    withCount: (name: string, count: number) => `${name} (회사 ${count.toLocaleString('ko-KR')}개)`,
    // 회사 목록 제목 `의약품 제조업 · 이 업종 회사 42개` (PRD 4장 F-15)
    companyTitle: (name: string, total: number) => `${name} · 이 업종 회사 ${total.toLocaleString('ko-KR')}개`,
    companyMeta: (name: string) => `${name} 회사 목록 · 재무 레이더`,
    companyCaption: '이 업종에 속한 회사 목록',
    companyColumns: {
      name: '종목명',
      code: '종목코드',
      market: '시장',
      marketCap: '시가총액',
    },
    // 시가총액 기준 한 줄 (PRD 4장 F-15). 기준일은 행의 bas_dt
    marketCapBasis: (basDt: string) => `시가총액은 보통주 기준, 주가 ${basDt} 기준`,
    // 회사 목록에서 지표 비교 목록으로 가는 링크 (PRD 4장 F-15)
    compareFromList: '지표로 견줘 보기 →',
    // 종목 화면 업종 이름 옆 툴팁 (PRD 4장 F-15, FS 9-7)
    stockTip: '같은 업종 회사를 둘러볼 수 있어.',
  },
  // 주가 수준 PER·PBR (PRD 4장 F-09, FS 9-3). 평가 표현 없이 값과 계산식만 쓴다
  valuation: {
    // 영역 제목 (PRD 4장 F-09 표)
    title: '주가 수준',
    // 보통주 표시 (PRD 4장 F-09 표)
    commonShareNote: '보통주 시가총액 기준',
    // 기준일 (PRD 4장 F-09 표): 제목 오른쪽에 붙는다
    basis: (basDt: string, latestYear: number) => `주가 ${basDt} 기준 · 순이익·자본 ${latestYear}년 기준`,
    // 시세 없는 종목 (PRD 10장 13번 기본안)
    noPrice: '주가 정보가 없어.',
    // 지표별 제목·이름·툴팁 (PRD 4장 F-09 표)
    metric: {
      per: {
        title: '주가가 버는 돈의 몇 배인가 (PER)',
        name: 'PER',
        tip: '시가총액을 1년 순이익으로 나눈 값이야. 10배면 지금 시가총액이 1년 순이익의 10배라는 뜻이야. 계산: 시가총액 ÷ 순이익',
        // 순이익이 0 이하면 PER을 계산하지 않는다 (PRD 4장 F-09 표)
        noValue: '순이익이 적자여서 PER을 계산하지 않아.',
      },
      pbr: {
        title: '주가가 회사 자기 돈(자본)의 몇 배인가 (PBR)',
        name: 'PBR',
        tip: '시가총액을 자본(자산에서 빚을 뺀 회사 몫)으로 나눈 값이야. 계산: 시가총액 ÷ 자본총계',
        noValue: '자본총계가 0 이하라서 PBR을 계산하지 않아.',
      },
    },
    // PBR 1배 선 툴팁 (PRD 4장 F-09 표)
    pbrLineTip: '시가총액과 회사 자본이 같아지는 지점이야. 좋고 나쁨을 가르는 기준은 아니야.',
  },
  // 배당 카드 (PRD 4장 F-14, FS 9-4). 표 칸·툴팁·고정 설명은 PRD 표 그대로
  dividend: {
    // 카드 제목 (PRD 4장 F-14 표)
    title: '배당 (보통주 기준)',
    // 제목 오른쪽 기준 표시 (PRD 4장 F-14 표)
    basis: (year: number) => `${year}년 사업보고서 기준`,
    // 표 행 이름과 툴팁 (PRD 4장 F-14 표)
    rowDps: '주당 배당금',
    rowDpsTip: '한 주를 가진 사람이 받은 현금배당이야.',
    rowYield: '배당수익률',
    rowYieldTip: '주당 배당금이 주가의 몇 %인지 나타낸 값이야.',
    // 칸 문구 (PRD 4장 F-14 표)
    none: '없음',
    // 확인 필요 칸 (PRD 10장 14번 기본안)
    check: '확인 필요',
    notDisclosed: '공시 없음',
    notDisclosedTip: '회사가 이 해 배당수익률을 공시하지 않았어.',
    // 카드 본문 대신 쓰는 문장 (PRD 4장 F-14 표)
    allNone: '최근 3년 동안 현금배당이 없었어.',
    noData: '이 회사의 배당 정보가 없어.',
    // 표 아래 고정 설명 두 줄 (PRD 4장 F-14 화면). "배당 기준일"에만 툴팁을 붙인다
    note: '배당수익률은 회사가 사업보고서에 적은 값이야.',
    noteRecordDatePrefix: '그해 ',
    noteRecordDate: '배당 기준일',
    noteRecordDateTip: '이날 주식을 가진 사람이 배당을 받아.',
    noteRecordDateSuffix: ' 무렵 주가로 계산해서 지금 주가로 따진 값과는 달라.',
  },
  // 최근 공시 칸 (PRD 4장 F-17, 10장 22·27·32번 기본안). "공시 더 보기" 링크는 PRD 11장 20번 확인 전이라 두지 않는다
  disclosure: {
    title: '최근 공시',
    error: '지금은 공시를 불러올 수 없어.',
    empty: '최근 공시가 없어.',
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
      // 눈금 aria-label용 범위: `범위 0~300%` (FS 7장 예시와 글자 단위로 같게)
      range: (min: number, max: number, suffix = '%') => `범위 ${min}~${max}${suffix}`,
      // 눈금 aria-label: `부채비율 87.3%, 범위 0~300%` (FS 7장)
      ariaLabel: (name: string, valueText: string, range: string) => `${name} ${valueText}, ${range}`,
      // 눈금 범위 밖 값일 때 aria-label 끝에 붙인다 (Gauge가 clamped일 때 사용)
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
  // F-10 조건 찾기 챗봇 (PRD 4장 F-10 문구·규칙, 반말. 외부 전송 안내는 PRD 10장 15번 기본안)
  chat: {
    inputLabel: '찾고 싶은 회사를 문장으로 적어 줘',
    submit: '찾기',
    externalNotice: '적은 문장은 조건을 찾으려고 외부 AI 서비스로 보내져.',
    examplesLead: '이렇게 적어 봐',
    found: (labels: string) => `이 조건으로 찾았어: ${labels}`,
    // 규칙 2: 부딪히는 두 조건
    conflict: (a: string, b: string) => `'${a}'와 '${b}'를 함께 만족하는 회사는 없어. 하나를 빼고 다시 적어 줘.`,
    // 규칙 2: 4개 이상
    truncated: (labels: string) => `필터는 3개까지라 앞의 3개만 골랐어: ${labels}. 나머지는 버튼에서 바꿔 골라 줘.`,
    // 규칙 3: 지원하지 않는 조건 종류 코드별 고정 문구
    unsupported: {
      industry: '업종 조건은 지원하지 않아. 업종은 \'업종으로 둘러보기\'에서 볼 수 있어.',
      dividend_yield: '배당수익률 조건은 지원하지 않아.',
      price: '주가 조건은 지원하지 않아.',
      other: '문장 속 일부 조건은 지원하지 않아서 빼고 찾았어.',
    },
    // 규칙 4: 조건이 아닌 말
    notCondition: '조건으로 바꿀 수 없는 질문이야. 예: 부채비율이 낮고 매출이 늘어난 회사',
    // 규칙 6: AI 응답 없음 (한도 초과·오류·시간 초과)
    unavailable: '지금은 문장으로 찾기를 쓸 수 없어. 아래 버튼으로 골라 줘.',
  },
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
    // PRD 4장 F-15 첫 화면 바로가기 2번째 줄 (2차)
    industryHint: '회사 이름을 모르겠다면?',
    industryLink: '업종으로 둘러보기 →',
  },
  // 경제 기사 (PRD 4장 F-18, 10장 21~25·28~32번 기본안, 사용자 확인 전). 반말 문구
  news: {
    // 칸 제목 (첫 화면·/news, 종목 화면)
    homeTitle: '경제 기사',
    stockTitle: '최근 기사',
    // /news 메타데이터 제목 (FS 9-6)
    pageMeta: '경제 기사 · 재무 레이더',
    // 칸 위 안내 (PRD 10장 21번)
    notice: '언론사 기사를 네이버 검색으로 그대로 보여주는 거야. 이 서비스의 의견이 아니야.',
    // 네이버 검색결과 표시 (BI 가이드 로고 파일 전까지 텍스트로 대신, 로고 파일 필요 R4)
    attributionText: '네이버 검색 결과',
    attributionLink: '네이버',
    // 실패·0건 (PRD 10장 22·31번)
    error: '지금은 기사를 불러올 수 없어.',
    empty: '찾은 기사가 없어.',
    // 첫 화면 칸 아래 링크 (PRD 3-5)
    moreLink: '기사 더 보기 →',
    // 짧은 종목명 안내 (PRD 10장 23번). 링크 글자는 네이버 뉴스 검색으로 간다
    shortName: '이름이 짧아서 다른 회사 기사가 섞여. 네이버에서 직접 찾아봐',
    shortNameLink: '네이버 뉴스 검색 →',
    // /news 이전·다음 (total을 모를 때 쓰는 링크)
    prevPage: '‹ 이전',
    nextPage: '다음 ›',
    pageLabel: '기사 페이지',
  },
  // 처음 읽는 순서 안내 (PRD 4장 F-16, FS 9-8). 반말. 말풍선 문구는 PRD 표 그대로
  tour: {
    // 첫 방문 알림 띠 (PRD 4장 F-16)
    banner: '어디부터 읽을지 모르겠다면 순서대로 짚어 줄게.',
    bannerStart: '읽는 순서 보기',
    // ✕ 버튼 aria-label
    close: '닫기',
    // 항상 보이는 "다시 보기" 버튼
    fixedButton: '읽는 순서',
    // 띠 영역 접근성 이름
    regionLabel: '읽는 순서 안내',
    // 말풍선 조작 (FS 9-8 driver 설정). 진행 문구는 driver.js 자리표시자 그대로
    progress: '{{current}}/{{total}}',
    prev: '이전',
    next: '다음',
    done: '끝',
    skip: '건너뛰기',
    // 단계 문구 (PRD 4장 F-16 표). 모든 회사에 같은 고정 문구
    steps: {
      sales: {
        title: '얼마나 파나',
        text: '막대가 매출이야. 회사가 한 해 동안 판 금액이고, 3년 동안 어떻게 바뀌었는지 볼 수 있어.',
      },
      profit: {
        title: '얼마나 남기나',
        text: '영업이익은 본업으로 남긴 돈이고, 순이익은 세금 같은 걸 다 빼고 마지막에 남은 돈이야. 0 아래로 내려간 막대는 적자란 뜻이야.',
        financialText:
          '금융회사는 매출액 항목이 없어서 영업이익·순이익만 보여줘. 영업이익은 본업으로 남긴 돈이고, 순이익은 세금 같은 걸 다 빼고 마지막에 남은 돈이야.',
      },
      debt: {
        title: '빚은 얼마나',
        text: '부채비율은 빚을 자본으로 나눈 값이야. 점이 이 회사의 위치고, 화살표는 3년 동안 움직인 방향이야.',
      },
      valuation: {
        title: '주가는 몇 배인가',
        text: 'PER은 주가가 회사가 버는 돈의 몇 배인지, PBR은 회사 자기 돈(자본)의 몇 배인지 보여줘. 눈금 위 표시는 같은 업종 회사들의 가운데 값이야.',
      },
      dividend: {
        title: '배당은 주나',
        text: '최근 3년 동안 한 주에 현금배당을 얼마 줬는지 보여줘. 배당수익률은 그해 배당 기준일 무렵 주가로 계산한 값이야.',
      },
    },
  },
  // 로그인·계정 (PRD F-11, 10장 17번, FS 12장 7·8·9번). 존댓말 예외 (로그인 화면)
  auth: {
    login: '로그인',
    // 로그인 뒤 메뉴 (PRD F-11). 숫자는 안 읽은 알림 수
    mypage: '마이페이지',
    logout: '로그아웃',
    logoutFailed: '로그아웃하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    dialogTitle: '이메일로 로그인',
    // 창을 여는 이유별 안내 (FS 9-11). 로그인 화면이라 존댓말
    reason: {
      // FS 9-11: 종목 추적 안내는 반말 (PRD F-12 문구)
      watch: '로그인하면 종목을 추적할 수 있어.',
      expired: '로그인 링크가 만료되었습니다. 다시 받아 주세요.',
      // FS 12장 9번
      required: '로그인이 필요합니다.',
    },
    inputLabel: '이메일 주소를 입력해 주세요',
    inputPlaceholder: '이메일 주소를 입력해 주세요',
    submit: '로그인 링크 받기',
    sending: '보내는 중입니다.',
    // PRD 10장 17번: 로그인 창 개인정보 안내 (사용자 확인 전 기본안)
    privacy: '이메일 주소는 로그인과 알림 발송에만 사용합니다.',
    // PRD F-11 보낸 뒤 문구
    sent: '로그인 링크를 보냈습니다. 메일함을 확인해 주세요.',
    sentNote: '메일이 오지 않으면 스팸함을 확인해 주세요.',
    resend: '링크 다시 보내기',
    resendWait: (seconds: number) => `${seconds}초 뒤에 다시 보낼 수 있습니다.`,
    // FS 12장 7번: 발송 실패
    sendFailed: '로그인 링크를 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    // FS 12장 8번: 이메일 형식 오류 (보내기 전 브라우저 검사)
    invalidEmail: '이메일 주소를 확인해 주세요.',
    close: '닫기',
    // PRD F-11 탈퇴 확인 문구 (마이페이지 계정 칸, 17b에서 사용)
    deleteConfirm: '탈퇴하면 추적 종목과 알림 기록이 모두 지워집니다. 탈퇴할까요?',
  },
  // 추적하기 버튼 (PRD F-12, 확장). 사용자 문구라 반말 (FS 12장 10번 포함)
  watch: {
    follow: '추적하기',
    following: '추적 중',
    limit: '추적 종목은 20개까지 등록할 수 있어.',
    failed: '지금은 바꿀 수 없어. 잠시 뒤 다시 해 줘.',
  },
  // 마이페이지 (PRD F-12, FS 9-12, FS 12장 9·10·11·13번). 칸 이름·안내는 반말, 로그인·계정 칸 문구는 존댓말 (PRD 3-1)
  mypage: {
    pageTitle: '마이페이지 · 재무 레이더',
    title: '마이페이지',
    // FS 12장 13번: `추적 종목 ({n}/20)`
    watchTitle: (count: number, limit: number) => `추적 종목 (${count}/${limit})`,
    // PRD F-12 추적 없음 안내
    noWatch: "아직 추적하는 종목이 없어. 종목 화면에서 '추적하기'를 눌러 봐.",
    // PRD F-12 목록에서 빠진 종목 표시
    delisted: '목록에서 빠짐',
    // FS 9-12 재무 데이터가 없는 종목 (카드)
    noFinancials: '재무 데이터 없음',
    // FS 12장 11번: 자본잠식 표시
    capitalFull: '완전 자본잠식',
    capitalPartial: '부분 자본잠식',
    // PRD F-12 "눈여겨볼 변화" 문장 더 있을 때
    moreInsights: (count: number) => `외 ${count}건`,
    // FS 9-12 최신 연도 전년 대비 증감률 한 줄 (반말, 권유·평가 표현 없음)
    growthUp: (year: number, metric: string, percent: string) => `${year}년 ${metric} 전년보다 ${percent} 증가`,
    growthDown: (year: number, metric: string, percent: string) => `${year}년 ${metric} 전년보다 ${percent} 감소`,
    growthFlat: (year: number, metric: string) => `${year}년 ${metric} 전년과 같아`,
    // FS 9-12 알림 설정 칸 (알림 목록 칸은 18a에서 추가)
    settingsTitle: '알림 설정',
    emailOptIn: '알림 메일 받기',
    // FS 12장 10번: 추적·메일 설정 변경 실패 (같은 문구를 쓴다)
    toggleFailed: '지금은 바꿀 수 없어. 잠시 뒤 다시 해 줘.',
    // FS 9-12 계정 칸 (로그인·계정 화면이라 존댓말)
    accountTitle: '계정',
    deleteButton: '탈퇴하기',
    deleteSubmit: '탈퇴',
    deleteCancel: '취소',
    // FS 기본안 없음 (PRD 10장 미정) → FS 12장 10번과 같은 문구로 임시 사용. 화면 확인 때 확정
    deleteFailed: '지금은 바꿀 수 없어. 잠시 뒤 다시 해 줘.',
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
