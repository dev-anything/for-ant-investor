import { copy } from '@/lib/copy';

// 없는 업종 주소 (FS 12장 5번 기본안). /industries/[division]의 notFound()가 여기로 온다
export default function IndustryCompaniesNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="rounded border-l-4 border-brand bg-surface px-4 py-6 text-lg text-ink">
        {copy.industry.notFoundDivision}
      </h1>
    </div>
  );
}
