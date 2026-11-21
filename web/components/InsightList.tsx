import { copy } from '@/lib/copy';

// FS 8-2 InsightList: "눈여겨볼 변화" 문장. 문장이 없으면 영역(제목 포함)을 그리지 않는다 (PRD 4장 F-05)
// items는 topInsights가 만든 문장 목록 (배치가 저장한 우선순위 순서 그대로)
export function InsightList({ items }: { items: { text: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="border-t border-neutral-200 py-4">
      <h3 className="text-base font-semibold text-neutral-900">{copy.reportCard.insightTitle}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
        {items.map((item, index) => (
          <li key={index}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
