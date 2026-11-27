'use client';

// 로그인 창의 로그인 화면: 이메일 + 비밀번호 (PRD F-11).
import { useState, type FormEvent } from 'react';
import { AuthError, AuthField, AuthSubmit } from '@/components/AuthFields';
import { isEmailFormat } from '@/lib/auth';
import { loginWithPassword } from '@/lib/auth-client';
import { copy } from '@/lib/copy';

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  // 로그인 성공 뒤 할 일 (추적 등록, 화면 새로 읽기)
  onLoggedIn: () => Promise<void>;
}

export function LoginForm({ email, onEmailChange, onLoggedIn }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(): Promise<void> {
    const value = email.trim();
    // 형식이 틀리면 요청 자체를 보내지 않는다 (FS 12장 8번)
    if (!isEmailFormat(value)) return setError(copy.auth.invalidEmail);
    // 로그인에서는 길이 규칙을 보지 않는다 (맞는지는 Supabase가 판단)
    if (password === '') return setError(copy.auth.emptyPassword);
    setError(null);
    setBusy(true);
    const result = await loginWithPassword(value, password);
    if (result === 'ok') return onLoggedIn();
    setBusy(false);
    setError(copy.auth.loginFailure[result]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!busy) void login();
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
        type="password"
        autoComplete="current-password"
        value={password}
        onValueChange={setPassword}
      />
      <AuthError message={error} />
      <AuthSubmit label={busy ? copy.auth.pending : copy.auth.submit.login} disabled={busy} />
    </form>
  );
}
