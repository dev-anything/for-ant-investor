'use client';

// 로그인 창의 회원가입 화면: 이메일 + 비밀번호 두 번, 가입 확인 메일 (PRD F-11).
import { useState, type FormEvent } from 'react';
import { AuthError, AuthField, AuthSubmit } from '@/components/AuthFields';
import { MailSentPanel } from '@/components/MailSentPanel';
import { checkNewPassword, isEmailFormat, PASSWORD_MIN_LENGTH } from '@/lib/auth';
import { resendSignupMail, signUpWithPassword } from '@/lib/auth-client';
import { copy } from '@/lib/copy';

interface SignupFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  // 확인 메일 링크가 돌아올 주소를 보내는 시점에 만든다
  getRedirectTo: () => string;
  // 메일 확인 없이 바로 세션이 생긴 경우
  onLoggedIn: () => Promise<void>;
}

export function SignupForm({ email, onEmailChange, getRedirectTo, onLoggedIn }: SignupFormProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(): Promise<void> {
    const value = email.trim();
    if (!isEmailFormat(value)) return setError(copy.auth.invalidEmail);
    const problem = checkNewPassword(password, confirm);
    if (problem !== null) return setError(copy.auth.passwordProblem[problem]);
    setError(null);
    setBusy(true);
    const result = await signUpWithPassword(value, password, getRedirectTo());
    if (result === 'signed_in') return onLoggedIn();
    setBusy(false);
    if (result === 'sent') return setSent(true);
    setError(result === 'weak' ? copy.auth.weakPassword : copy.auth.sendFailed);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!busy) void signUp();
  }

  if (sent) {
    return (
      <MailSentPanel
        message={copy.auth.signupSent}
        note={copy.auth.signupSentNote}
        onResend={() => resendSignupMail(email.trim(), getRedirectTo())}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField
        label={copy.auth.emailLabel}
        type="email"
        autoComplete="email"
        placeholder={copy.auth.emailPlaceholder}
        value={email}
        onValueChange={onEmailChange}
      />
      <AuthField
        label={copy.auth.passwordLabel}
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
      <p className="text-meta text-ink-sub">{copy.auth.privacy}</p>
      <AuthSubmit label={busy ? copy.auth.pending : copy.auth.submit.signup} disabled={busy} />
    </form>
  );
}
