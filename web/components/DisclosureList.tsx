import { copy } from '@/lib/copy';
import { getRecentDisclosures } from '@/lib/data/disclosures';
import { dartViewerUrl } from '@/lib/disclosure';
import { formatRceptDt } from '@/lib/format';

// FS 9-5 DisclosureList (PRD 4장 F-17), DESIGN.md 4-1·6-9: 최근 공시 5개를 흰 카드에 담는다
export async function DisclosureList({ corpCode }: { corpCode: string | null }) {
  const result = await getRecentDisclosures(corpCode);

  return (
    <section aria-labelledby="disclosure-title" className="rounded-lg bg-white p-4 sm:p-6">
      <h2 id="disclosure-title" className="text-lg font-semibold text-ink">
        {copy.disclosure.title}
      </h2>

      {result.status === 'error' && <p className="mt-4 text-sm text-ink-sub">{copy.disclosure.error}</p>}
      {result.status === 'ok' && result.items.length === 0 && (
        <p className="mt-4 text-sm text-ink-sub">{copy.disclosure.empty}</p>
      )}

      {result.status === 'ok' && result.items.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
          {result.items.map((item) => (
            <li key={item.rceptNo} className="px-4 py-3">
              {/* 줄 전체가 DART 원문 링크 */}
              <a
                href={dartViewerUrl(item.rceptNo)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="line-clamp-2 text-base font-medium text-ink group-hover:text-brand">
                  {item.reportNm}
                </span>
                <span className="mt-1 block text-meta text-muted">
                  {`${item.filer} · ${formatRceptDt(item.rceptDt) ?? item.rceptDt}`}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
