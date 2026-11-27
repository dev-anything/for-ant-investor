'use client';

// 메일을 보낸 뒤 화면: 안내와 다시 보내기 (FS 9-11).
import { useEffect, useState } from 'react';
import { AuthError } from '@/components/AuthFields';
import { copy } from '@/lib/copy';

// PRD F-11: "메일 다시 보내기"는 60초 뒤에 누를 수 있다
const RESEND_WAIT_SECONDS = 60;

interface MailSentPanelProps {
  message: string;
  note: string;
  // 다시 보내기. 성공하면 true
  onResend: () => Promise<boolean>;
}

export function MailSentPanel({ message, note, onResend }: MailSentPanelProps) {
  const [remaining, setRemaining] = useState(RESEND_WAIT_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 재전송 대기 1초 단위 카운트다운
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function resend(): Promise<void> {
    setError(null);
    setBusy(true);
    const ok = await onResend();
    setBusy(false);
    if (ok) return setRemaining(RESEND_WAIT_SECONDS);
    setError(copy.auth.sendFailed);
  }

  return (
    <div className="space-y-2 text-sm">
      <p role="status" className="text-ink">{message}</p>
      <p className="text-ink-sub">{note}</p>
      <AuthError message={error} />
      <button
        type="button"
        onClick={() => void resend()}
        disabled={busy || remaining > 0}
        className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {remaining > 0 ? copy.auth.resendWait(remaining) : copy.auth.resend}
      </button>
    </div>
  );
}
