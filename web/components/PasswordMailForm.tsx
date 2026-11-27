'use client';

// 로그인 창의 비밀번호 설정·재설정 화면: 설정 링크 메일 요청 (PRD F-11).
// 비밀번호를 잊은 경우와, 예전에 메일 링크로 만들어 비밀번호가 없는 계정이 함께 쓴다.
import { useState, type FormEvent } from 'react';
import { AuthError, AuthField, AuthSubmit } from '@/components/AuthFields';
import { MailSentPanel } from '@/components/MailSentPanel';
import { isEmailFormat } from '@/lib/auth';
import { requestPasswordMail } from '@/lib/auth-client';
import { copy } from '@/lib/copy';

interface PasswordMailFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  getRedirectTo: () => string;
}

export function PasswordMailForm({ email, onEmailChange, getRedirectTo }: PasswordMailFormProps) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(): Promise<void> {
    const value = email.trim();
    if (!isEmailFormat(value)) return setError(copy.auth.invalidEmail);
    setError(null);
    setBusy(true);
    const ok = await requestPasswordMail(value, getRedirectTo());
    setBusy(false);
    if (ok) return setSent(true);
    setError(copy.auth.sendFailed);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!busy) void send();
  }

  if (sent) {
    return (
      <MailSentPanel
        message={copy.auth.resetSent}
        note={copy.auth.resetSentNote}
        onResend={() => requestPasswordMail(email.trim(), getRedirectTo())}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <p className="text-sm text-ink-sub">{copy.auth.resetNote}</p>
      <AuthField
        label={copy.auth.emailLabel}
        type="email"
        autoComplete="email"
        placeholder={copy.auth.emailPlaceholder}
        value={email}
        onValueChange={onEmailChange}
      />
      <AuthError message={error} />
      <AuthSubmit label={busy ? copy.auth.pending : copy.auth.submit.reset} disabled={busy} />
    </form>
  );
}
