import { copy } from '@/lib/copy';
import { getRecentDisclosures } from '@/lib/data/disclosures';
import { dartViewerUrl } from '@/lib/disclosure';
import { formatRceptDt } from '@/lib/format';

// FS 9-5 DisclosureList (PRD 4장 F-17): 최근 공시 5개. 서버 컴포넌트, Suspense 안에서 DART를 부른다
// 실패해도 이 칸만 실패 문구를 보여준다 (페이지 전체는 그대로, PRD 4장 F-17 예외)
export async function DisclosureList({ corpCode }: { corpCode: string | null }) {
  const result = await getRecentDisclosures(corpCode);

  return (
    <section aria-labelledby="disclosure-title">
      <h2 id="disclosure-title" className="text-lg font-bold text-neutral-900">
        {copy.disclosure.title}
      </h2>

      {result.status === 'error' && <p className="mt-4 text-sm text-neutral-700">{copy.disclosure.error}</p>}
      {result.status === 'ok' && result.items.length === 0 && (
        <p className="mt-4 text-sm text-neutral-700">{copy.disclosure.empty}</p>
      )}

      {result.status === 'ok' && result.items.length > 0 && (
        <ul className="mt-4 divide-y divide-neutral-200 rounded border border-neutral-300">
          {result.items.map((item) => (
            <li key={item.rceptNo} className="px-4 py-3 text-sm">
              {/* 줄 전체가 DART 원문 링크. 공시 제목은 받은 그대로 쓴다 (금지 표현 검사 안 함, PRD 4장 F-17) */}
              <a
                href={dartViewerUrl(item.rceptNo)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                {`${item.reportNm} · ${item.filer} · ${formatRceptDt(item.rceptDt) ?? item.rceptDt}`}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
