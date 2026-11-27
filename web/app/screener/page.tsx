import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ScreenerClient } from '@/components/ScreenerClient';
import { getReferenceYear, getScreenerResult, type ScreenerResult } from '@/lib/data/screener';
import { copy } from '@/lib/copy';
import { pageCountOf } from '@/lib/pagination';
import { parseScreenerParams, toQuery, type RawParams, type ScreenerState } from '@/lib/params';

// FS 3-3: 화면 1시간. 검색 조건이 주소에 있으면 Next가 요청마다 그린다
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${copy.screener.title} · ${copy.brand}`,
};

type ScreenerPageProps = { searchParams: Promise<RawParams> };

// 첫 화면 결과 (FS 8-3). target이 있으면 그 쪽으로 보내고, DB 오류면 failed로 오류 문구를 보인다
interface InitialResolution {
  target: ScreenerState | null;
  result: ScreenerResult | null;
  failed: boolean;
}

async function resolveInitial(state: ScreenerState): Promise<InitialResolution> {
  // 필터가 없으면 목록을 보여주지 않는다 (PRD 4장 F-07, 10장 11번)
  if (state.filters.length === 0) return { target: null, result: null, failed: false };
  try {
    const result = await getScreenerResult(state);
    if (result.rows.length > 0 || state.page <= 1) return { target: null, result, failed: false };

    // 범위를 넘은 쪽: 1쪽으로 전체 수를 얻어 마지막 쪽으로 보낸다 (FS 5-2)
    const first = await getScreenerResult({ ...state, page: 1 });
    if (first.total === 0) return { target: null, result: first, failed: false };
    return { target: { ...state, page: pageCountOf(first.total, state.size) }, result: null, failed: false };
  } catch (error) {
    // 로그에는 메시지만 (FS 4-2). 키·요청 주소는 없다
    console.error(error instanceof Error ? error.message : 'screener 알 수 없는 오류');
    return { target: null, result: null, failed: true };
  }
}

// 기준 연도 (툴팁·열 제목). 못 읽으면 연도 없이 보인다
async function loadReferenceYear(): Promise<number | null> {
  try {
    return await getReferenceYear();
  } catch (error) {
    console.error(error instanceof Error ? error.message : '기준 연도 알 수 없는 오류');
    return null;
  }
}

// FS 8-3 `/screener` (서버): 주소를 읽어 첫 결과를 채운다. 상호작용은 ScreenerClient가 맡는다
export default async function ScreenerPage({ searchParams }: ScreenerPageProps) {
  const state = parseScreenerParams(await searchParams);
  const [refYear, resolved] = await Promise.all([loadReferenceYear(), resolveInitial(state)]);
  if (resolved.target) redirect(`/screener?${toQuery(resolved.target)}`);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{copy.screener.title}</h1>
      <ScreenerClient
        initialState={state}
        initialResult={resolved.result}
        initialFailed={resolved.failed}
        refYear={refYear}
      />
    </div>
  );
}
