import type { Metadata } from 'next';
import { Notice } from '@/components/Notice';
import { UnsubscribeButton } from '@/components/UnsubscribeButton';
import { copy } from '@/lib/copy';
import { isUnsubscribeTokenFormat } from '@/lib/notify';

// 토큰으로 읽는 화면이라 캐시하지 않는다. 검색 결과에 남지 않도록 noindex (FS 9-13)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: copy.unsubscribe.pageTitle,
  robots: { index: false, follow: false },
};

type UnsubscribePageProps = { searchParams: Promise<{ token?: string | string[] }> };

// FS 9-13 `/unsubscribe?token=` (서버). 로그인 없이 열린다. 이 화면에서는 아무것도 바꾸지 않는다 (GET).
export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;
  // 같은 이름이 여러 번 오면(배열) 형식이 틀린 것으로 본다
  const value = typeof token === 'string' ? token : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-xl font-bold text-neutral-900">{copy.unsubscribe.pageTitle}</h1>
      <div className="mt-6">
        {isUnsubscribeTokenFormat(value) ? (
          <UnsubscribeButton token={value} />
        ) : (
          <Notice variant="box">{copy.unsubscribe.invalid}</Notice>
        )}
      </div>
    </div>
  );
}
