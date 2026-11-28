'use client';

// `/reset-password`의 새 비밀번호 입력 (PRD F-11). 저장해도 로그인 상태가 유지된다.
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AuthError, AuthField, AuthSubmit } from '@/components/AuthFields';
import { checkNewPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth';
import { updatePassword } from '@/lib/auth-client';
import { copy } from '@/lib/copy';

const LINK_CLASS = 'text-brand font-medium';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(): Promise<void> {
    const problem = checkNewPassword(password, confirm);
    if (problem !== null) return setError(copy.auth.passwordProblem[problem]);
    setError(null);
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result === 'ok') return setDone(true);
    setError(copy.auth.resetPage.failure[result]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!busy) void save();
  }

  if (done) {
    return (
      <div className="space-y-4 text-sm">
        <p role="status" className="text-ink">{copy.auth.resetPage.done}</p>
        <p className="flex gap-4 text-ink-sub">
          <Link href="/" className={LINK_CLASS}>
            {copy.auth.resetPage.home}
          </Link>
          <Link href="/mypage" className={LINK_CLASS}>
            {copy.auth.resetPage.mypage}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField
        label={copy.auth.newPasswordLabel}
        hint={copy.auth.passwordHint(PASSWORD_MIN_LENGTH)}
        type="password"
        autoComplete="new-password"
        value={password}
        onValueChange={setPassword}
      />
      <AuthField
        label={copy.auth.confirmLabel}
        type="password"
        autoComplete="new-password"
        value={confirm}
        onValueChange={setConfirm}
      />
      <AuthError message={error} />
      <AuthSubmit label={busy ? copy.auth.pending : copy.auth.resetPage.submit} disabled={busy} />
    </form>
  );
}
