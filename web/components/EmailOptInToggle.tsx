'use client';

// FS 9-12 EmailOptInToggle, DESIGN.md 2-1: 알림 메일 받기 켜기·끄기 (PRD F-12, 확장).
// 바꾸면 PATCH /api/settings로 보내고, 실패하면 되돌린 뒤 FS 12장 10번 문구를 보인다.
import { useId, useState } from 'react';
import { copy } from '@/lib/copy';

interface EmailOptInToggleProps {
  initialValue: boolean;
}

export function EmailOptInToggle({ initialValue }: EmailOptInToggleProps) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function change(next: boolean): Promise<void> {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setValue(next);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOptIn: next }),
      });
      if (!response.ok) throw new Error(`설정 변경 실패 ${response.status}`);
    } catch (error: unknown) {
      // 실패하면 화면을 원래 값으로 되돌린다 (저장되지 않은 값을 켜진 것처럼 두지 않는다)
      console.warn('알림 메일 설정 변경 실패', error instanceof Error ? error.name : '');
      setValue(!next);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm text-ink">
        <input
          id={inputId}
          type="checkbox"
          className="size-4 accent-ink"
          checked={value}
          disabled={busy}
          onChange={(event) => void change(event.target.checked)}
        />
        {copy.mypage.emailOptIn}
      </label>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {copy.mypage.toggleFailed}
        </p>
      )}
    </div>
  );
}
