'use client';

// 메일을 보낸 뒤 화면: 안내와 다시 보내기 (FS 9-11).
import { Info } from 'lucide-react';
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
    <div className="space-y-4 text-sm">
      {/* DESIGN 6-12: 안내는 subtle 박스 + ⓘ. 경고색은 쓰지 않는다 */}
      <div className="flex gap-2 rounded-md bg-subtle p-4">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <div className="space-y-1">
          <p role="status" className="text-ink">{message}</p>
          <p className="text-ink-sub">{note}</p>
        </div>
      </div>
      <AuthError message={error} />
      <button
        type="button"
        onClick={() => void resend()}
        disabled={busy || remaining > 0}
        className="h-11 w-full rounded-md border border-line bg-surface px-5 font-semibold text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
      >
        {remaining > 0 ? copy.auth.resendWait(remaining) : copy.auth.resend}
      </button>
    </div>
  );
}
