'use client';

// FS 9-13 수신 거부 확인 화면 (클라이언트): 확인 문구와 [수신 거부] 버튼 (PRD F-13, PRD 10장 34번).
// GET으로는 아무것도 바꾸지 않고, 버튼을 눌러야 `POST /api/unsubscribe`로 끈다.
import { useState } from 'react';
import { copy } from '@/lib/copy';

type Phase = 'idle' | 'busy' | 'done' | 'invalid' | 'failed';

interface UnsubscribeButtonProps {
  token: string;
}

export function UnsubscribeButton({ token }: UnsubscribeButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle');

  async function unsubscribe(): Promise<void> {
    setPhase('busy');
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      // 400(형식 틀림)·404(없는 토큰)은 같은 안내로 보인다 (PRD 10장 34번)
      if (response.status === 400 || response.status === 404) return setPhase('invalid');
      if (!response.ok) throw new Error(`수신 거부 실패 ${response.status}`);
      setPhase('done');
    } catch (error: unknown) {
      console.warn('수신 거부 실패', error instanceof Error ? error.name : '');
      setPhase('failed');
    }
  }

  if (phase === 'done') return <p className="text-neutral-900">{copy.unsubscribe.done}</p>;
  if (phase === 'invalid') return <p className="text-neutral-900">{copy.unsubscribe.invalid}</p>;

  return (
    <div>
      <p className="text-neutral-900">{copy.unsubscribe.confirm}</p>
      <button
        type="button"
        onClick={() => void unsubscribe()}
        disabled={phase === 'busy'}
        className="mt-4 rounded border border-neutral-900 bg-neutral-900 px-4 py-2 text-white transition-colors hover:bg-neutral-700 disabled:border-neutral-400 disabled:bg-neutral-400"
      >
        {copy.unsubscribe.submit}
      </button>
      {phase === 'failed' && (
        <p role="alert" className="mt-3 text-sm text-neutral-900">
          {copy.unsubscribe.failed}
        </p>
      )}
    </div>
  );
}
