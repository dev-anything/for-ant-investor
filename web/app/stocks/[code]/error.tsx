'use client';

import { ErrorState } from '@/components/ErrorState';
import { copy } from '@/lib/copy';

// FS 8-2: 조회 오류 화면. 헤더·푸터는 layout이 그대로 둔다. error.tsx는 클라이언트 컴포넌트여야 한다
export default function StockError() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ErrorState message={copy.dbError} />
    </div>
  );
}
