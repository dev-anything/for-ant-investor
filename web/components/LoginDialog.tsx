'use client';

// FS 9-11 LoginDialog: 로그인·회원가입·비밀번호 설정 창 (HTML dialog, PRD F-11 존댓말).
// 열 때마다 새로 마운트해서 입력·보냄 상태가 이전 열림에 남지 않게 한다.
import { useEffect, useId, useRef, useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { PasswordMailForm } from '@/components/PasswordMailForm';
import { SignupForm } from '@/components/SignupForm';
import { buildLoginRedirect, isWatchCodeFormat, RESET_PASSWORD_PATH } from '@/lib/auth';
import { registerWatchAfterLogin } from '@/lib/auth-client';
import { copy } from '@/lib/copy';

export type LoginReason = 'watch' | 'expired' | 'required';

type Mode = 'login' | 'signup' | 'reset';

// 화면마다 갈 수 있는 다른 화면
const MODE_LINKS: Record<Mode, { mode: Mode; label: string }[]> = {
  login: [
    { mode: 'signup', label: copy.auth.toSignup },
    { mode: 'reset', label: copy.auth.toReset },
  ],
  signup: [
    { mode: 'login', label: copy.auth.toLogin },
    { mode: 'reset', label: copy.auth.toReset },
  ],
  reset: [{ mode: 'login', label: copy.auth.toLogin }],
};

// DESIGN 5-6: 화면 전환은 같은 동작을 탭 모양으로 보여준다 (전환 로직은 그대로)
const TAB_CLASS =
  'rounded-t-md border-b-2 border-transparent px-3 py-2 text-sm text-ink-sub transition-colors hover:border-brand hover:text-brand';

const CLOSE_CLASS = 'text-sm text-ink-sub hover:text-ink';

interface LoginDialogProps {
  onClose: () => void;
  reason?: LoginReason;
  // 추적 종목 코드 (로그인 뒤 자동 등록용, FS 9-12)
  watch?: string;
}

// 로그인 뒤 돌아갈 경로. 이 창을 연 현재 주소에서 로그인 쿼리만 뺀다
function currentNextPath(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('login');
  url.searchParams.delete('watch');
  return `${url.pathname}${url.search}`;
}

export function LoginDialog({ onClose, reason, watch }: LoginDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [mode, setMode] = useState<Mode>('login');
  // 화면을 바꿔도 입력한 이메일은 남긴다
  const [email, setEmail] = useState('');

  // 마운트되면 모달로 연다. 초점은 첫 조작 요소에 간다 (dialog 기본 동작)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
  }, []);

  // 로그인 성공: 추적 등록 뒤 화면을 새로 읽는다 (상단 메뉴·추적 버튼이 로그인 상태를 다시 묻게)
  async function finishLogin(): Promise<void> {
    const next = new URL(currentNextPath(), window.location.origin);
    if (watch !== undefined && isWatchCodeFormat(watch) && (await registerWatchAfterLogin(watch))) {
      // 20개 상한 문구는 `WatchButton`이 쿼리를 읽어 보여준다 (FS 9-12)
      next.searchParams.set('watch', 'limit');
    }
    window.location.replace(next.href);
  }

  const reasonText = reason !== undefined && mode !== 'reset' ? copy.auth.reason[reason] : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-0 h-[100dvh] w-screen max-w-none rounded-none border border-line bg-surface p-6 text-left text-ink backdrop:bg-overlay sm:m-auto sm:h-auto sm:w-[calc(100%-2rem)] sm:max-w-[400px] sm:rounded-lg sm:p-8"
    >
      <h2 id={titleId} className="text-lg font-semibold text-ink">
        {copy.auth.title[mode]}
      </h2>

      {/* DESIGN 5-6: 전환 버튼을 위쪽 탭으로 옮겨 놓는다 (mode·setMode 동작은 그대로) */}
      <div className="mt-4 flex gap-2 border-b border-line">
        {MODE_LINKS[mode].map((link) => (
          <button key={link.mode} type="button" onClick={() => setMode(link.mode)} className={TAB_CLASS}>
            {link.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {reasonText !== null && <p className="text-sm text-ink-sub">{reasonText}</p>}
        {mode === 'login' && <LoginForm email={email} onEmailChange={setEmail} onLoggedIn={finishLogin} />}
        {mode === 'signup' && (
          <SignupForm
            email={email}
            onEmailChange={setEmail}
            getRedirectTo={() => buildLoginRedirect(window.location.origin, currentNextPath(), watch)}
            onLoggedIn={finishLogin}
          />
        )}
        {mode === 'reset' && (
          <PasswordMailForm
            email={email}
            onEmailChange={setEmail}
            getRedirectTo={() => buildLoginRedirect(window.location.origin, RESET_PASSWORD_PATH)}
          />
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onClose} className={CLOSE_CLASS}>
          {copy.auth.close}
        </button>
      </div>
    </dialog>
  );
}
