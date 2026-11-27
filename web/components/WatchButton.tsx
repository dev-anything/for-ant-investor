'use client';

// FS 9-12 WatchButton, PRD F-12, DESIGN.md 5-1: 종목 화면의 "추적하기" / "추적 중" 버튼.
// 공개 화면은 쿠키를 읽지 않으므로 로그인 여부와 추적 상태를 화면이 뜬 뒤 API로 묻는다.
import { useEffect, useState } from 'react';
import { LoginDialog } from '@/components/LoginDialog';
import { copy } from '@/lib/copy';

type WatchState = 'checking' | 'logged_out' | 'off' | 'on' | 'error';

// DESIGN 6-1: 높이 44px, 모서리 12px, 글자 15px/600. 응답 전·후 폭이 흔들리지 않게 최소 폭을 둔다
const BUTTON_CLASS =
  'inline-flex h-11 min-w-24 items-center justify-center rounded-md px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted';

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
      {/* DESIGN 6-1: '추적하기'는 주요 버튼(brand 채움), '추적 중'은 보조 버튼(subtle 바탕) */}
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={disabled}
        aria-pressed={isOn}
        className={`${BUTTON_CLASS} ${
          isOn ? 'bg-subtle text-ink hover:bg-line' : 'bg-brand text-white hover:bg-brand-hover'
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
