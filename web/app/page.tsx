import { copy } from '@/lib/copy';
import { db } from '@/lib/supabase/server';

// DEV_PLAN 0b: 임시 홈 화면 (v_search_targets 1행 조회 확인용, 1b에서 교체)
export default async function HomePage() {
  const { data, error } = await db()
    .from('v_search_targets')
    .select('short_code,itms_nm')
    .limit(1);

  if (error) {
    throw new Error(`DB 조회 오류: ${error.message}`);
  }

  const stock = data?.[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {stock ? (
        <p className="text-neutral-700">
          {copy.home.stockLabel} {stock.itms_nm} ({stock.short_code})
        </p>
      ) : (
        <p className="text-neutral-500">{copy.home.empty}</p>
      )}
    </div>
  );
}
