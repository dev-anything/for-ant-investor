'use client';

// FS 9-11 LoginDialog: 이메일 매직링크 요청 창 (HTML dialog, PRD F-11 존댓말).
// 열 때마다 새로 마운트해서 상태(입력·보냄·재전송 대기)가 이전 열림에 남지 않게 한다.
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { buildLoginRedirect, isEmailFormat } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { getBrowserClient } from '@/lib/supabase/browser';

// PRD F-11: "링크 다시 보내기"는 60초 뒤에 누를 수 있다
const RESEND_WAIT_SECONDS = 60;

export type LoginReason = 'watch' | 'expired' | 'required';

type SendState = 'input' | 'sending' | 'sent' | 'failed';

interface LoginDialogProps {
  onClose: () => void;
  reason?: LoginReason;
  // 추적 종목 코드 (로그인 뒤 자동 등록용, FS 9-12). 형식이 틀리면 buildLoginRedirect가 뺀다
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
  const inputId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [sendState, setSendState] = useState<SendState>('input');
  const [formError, setFormError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  // 마운트되면 모달로 연다. 초점은 첫 입력창에 간다 (dialog 기본 동작)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
  }, []);

  // 재전송 대기 1초 단위 카운트다운
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function send(): Promise<void> {
    const value = email.trim();
    // FS 12장 8번: 형식이 틀리면 요청 자체를 보내지 않는다
    if (!isEmailFormat(value)) {
      setFormError(copy.auth.invalidEmail);
      return;
    }
    setFormError(null);
    const client = getBrowserClient();
    // 로그인 기능이 꺼져 있으면 보낼 수 없다 (FS 9-10)
    if (client === null) {
      setSendState('failed');
      return;
    }
    setSendState('sending');
    try {
      const { error } = await client.auth.signInWithOtp({
        email: value,
        options: {
          emailRedirectTo: buildLoginRedirect(window.location.origin, currentNextPath(), watch),
          shouldCreateUser: true,
        },
      });
      if (error) {
        console.warn('로그인 링크 요청 실패', error.name);
        setSendState('failed');
        return;
      }
    } catch (error: unknown) {
      console.warn('로그인 링크 요청 중 오류', error instanceof Error ? error.name : '');
      setSendState('failed');
      return;
    }
    setSendState('sent');
    setRemaining(RESEND_WAIT_SECONDS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (sendState === 'sending') return;
    void send();
  }

  const isSent = sendState === 'sent';
  const reasonText = reason !== undefined ? copy.auth.reason[reason] : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="w-[calc(100%-2rem)] max-w-sm rounded-lg bg-white p-6 text-neutral-900 shadow-lg backdrop:bg-black/40"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {copy.auth.dialogTitle}
      </h2>

      {isSent ? (
        <div className="mt-4 space-y-2 text-sm">
          <p>{copy.auth.sent}</p>
          <p className="text-neutral-600">{copy.auth.sentNote}</p>
          <button
            type="button"
            onClick={() => void send()}
            disabled={remaining > 0}
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
          >
            {remaining > 0 ? copy.auth.resendWait(remaining) : copy.auth.resend}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
          {reasonText !== null && <p className="text-sm text-neutral-700">{reasonText}</p>}
          <label htmlFor={inputId} className="sr-only">
            {copy.auth.inputLabel}
          </label>
          <input
            id={inputId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.auth.inputPlaceholder}
            aria-invalid={formError !== null}
            aria-describedby={formError !== null ? errorId : undefined}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
          {formError !== null && (
            <p id={errorId} className="text-sm text-neutral-900">
              {formError}
            </p>
          )}
          {sendState === 'failed' && <p className="text-sm text-neutral-900">{copy.auth.sendFailed}</p>}
          <p className="text-xs text-neutral-500">{copy.auth.privacy}</p>
          <button
            type="submit"
            disabled={sendState === 'sending'}
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {sendState === 'sending' ? copy.auth.sending : copy.auth.submit}
          </button>
        </form>
      )}

      <div className="mt-4 text-right">
        <button type="button" onClick={onClose} className="text-sm text-neutral-600 hover:text-neutral-900">
          {copy.auth.close}
        </button>
      </div>
    </dialog>
  );
}
