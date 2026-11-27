'use client';

// FS 9-12 WatchButton, PRD F-12, DESIGN-remember 공통 컨트롤: 종목 화면의 "추적하기" / "추적 중" 버튼.
// 공개 화면은 쿠키를 읽지 않으므로 로그인 여부와 추적 상태를 화면이 뜬 뒤 API로 묻는다.
import { useEffect, useState } from 'react';
import { LoginDialog } from '@/components/LoginDialog';
import { copy } from '@/lib/copy';

type WatchState = 'checking' | 'logged_out' | 'off' | 'on' | 'error';

// 응답 전·로그인 전·후 글자 폭이 달라지지 않게 버튼 폭을 고정한다
const BUTTON_CLASS =
  'min-w-24 rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export function WatchButton({ code }: { code: string }) {
  const [state, setState] = useState<WatchState>('checking');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // 로그인 뒤 자동 등록이 상한에 걸리면 `?watch=limit`이 붙는다 (FS 9-12). 문구를 보이고 쿼리는 지운다
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('watch') !== 'limit') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 상태(URL 쿼리)를 한 번 읽어 화면 상태로 옮기는 동기화라 effect가 맞다 (서버에서는 window를 못 읽음)
    setMessage(copy.watch.limit);
    url.searchParams.delete('watch');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  // 마운트 때 추적 상태를 묻는다. 401이면 로그인 전
  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const response = await fetch(`/api/watchlist?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
        if (!active) return;
        if (response.status === 401) return setState('logged_out');
        if (!response.ok) return setState('error');
        const body: unknown = await response.json();
        const watching = typeof body === 'object' && body !== null && 'watching' in body && body.watching === true;
        setState(watching ? 'on' : 'off');
      } catch (error: unknown) {
        console.warn('추적 상태 확인 실패', error instanceof Error ? error.name : '');
        if (active) setState('error');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [code]);

  async function toggle(): Promise<void> {
    if (state === 'logged_out') {
      setLoginOpen(true);
      return;
    }
    if (busy || (state !== 'on' && state !== 'off')) return;
    const watching = state === 'on';
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/watchlist', {
        method: watching ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        cache: 'no-store',
      });
      if (response.status === 401) return setState('logged_out');
      if (watching && response.status === 204) return setState('off');
      if (!watching && response.status === 201) return setState('on');
      // 20개 상한은 409 `limit` (FS 9-12)
      setMessage(response.status === 409 ? copy.watch.limit : copy.watch.failed);
    } catch (error: unknown) {
      console.warn('추적 변경 요청 실패', error instanceof Error ? error.name : '');
      setMessage(copy.watch.failed);
    } finally {
      setBusy(false);
    }
  }

  const isOn = state === 'on';
  const label = isOn ? copy.watch.following : copy.watch.follow;
  const disabled = state === 'checking' || state === 'error' || busy;

  return (
    <div className="flex flex-col items-end gap-1">
      {/* DESIGN-remember: '추적하기'(비추적)는 주요 버튼(검정 채움), '추적 중'(추적 활성)은 보조 버튼(흰 바탕+회색 테두리) */}
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={disabled}
        aria-pressed={isOn}
        className={`${BUTTON_CLASS} ${
          isOn
            ? 'border-line bg-white text-ink hover:bg-surface'
            : 'border-primary bg-primary text-primary-fg hover:bg-primary-hover'
        }`}
      >
        {label}
      </button>
      {message !== null && (
        <p role="status" className="text-xs text-ink">
          {message}
        </p>
      )}
      {loginOpen && (
        <LoginDialog reason="watch" watch={code} onClose={() => setLoginOpen(false)} />
      )}
    </div>
  );
}
