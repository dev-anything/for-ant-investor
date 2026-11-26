import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { copy } from '@/lib/copy';
import { createSessionClient } from '@/lib/supabase/session';
import type { Metadata } from 'next';

// 로그인 세션으로 읽는 화면이라 캐시하지 않는다
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: copy.auth.resetPage.pageTitle,
  robots: { index: false, follow: false },
};

// FS 9-11 `/reset-password` (서버). 설정 메일 링크 → `/auth/callback`이 세션을 만든 뒤 여기로 보낸다.
export default async function ResetPasswordPage() {
  const supabase = await createSessionClient();
  if (supabase === null) redirect('/');
  const { data } = await supabase.auth.getUser();
  if (data.user === null) redirect('/?login=required');

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-xl font-bold text-neutral-900">{copy.auth.resetPage.title}</h1>
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
