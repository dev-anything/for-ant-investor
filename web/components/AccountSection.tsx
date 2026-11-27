'use client';

// FS 9-12 계정 칸 · FS 9-11 탈퇴 확인: 로그아웃과 탈퇴 (PRD F-11, 존댓말 예외 칸, DESIGN-remember 공통 컨트롤).
// 로그아웃과 탈퇴 뒤에는 전체 이동으로 `/`에 간다. 상단 로그인 메뉴(AuthMenu)의 상태를 새로 읽게 하려고다.
import { useEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import { getBrowserClient } from '@/lib/supabase/browser';

export function AccountSection() {
  const [logoutFailed, setLogoutFailed] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 탈퇴 확인 창은 열 때 모달로 띄운다 (LoginDialog와 같은 방식)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  async function logout(): Promise<void> {
    const client = getBrowserClient();
    // 로그인 기능이 꺼져 있으면 로그인된 상태일 수 없다
    if (client === null) return;
    setLogoutFailed(false);
    const { error } = await client.auth.signOut();
    if (error) {
      console.warn('로그아웃 실패', error.name);
      setLogoutFailed(true);
      return;
    }
    window.location.replace('/');
  }

  async function deleteAccount(): Promise<void> {
    setDeleteFailed(false);
    setDeleting(true);
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' });
      if (!response.ok) throw new Error(`탈퇴 실패 ${response.status}`);
      window.location.replace('/');
    } catch (error: unknown) {
      console.warn('탈퇴 실패', error instanceof Error ? error.name : '');
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteFailed(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded-md border border-line bg-white px-3 py-2 text-ink transition-colors hover:bg-surface"
      >
        {copy.auth.logout}
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-md border border-line bg-white px-3 py-2 text-ink transition-colors hover:bg-surface"
      >
        {copy.mypage.deleteButton}
      </button>
      {logoutFailed && (
        <p role="alert" className="w-full text-ink">
          {copy.auth.logoutFailed}
        </p>
      )}
      {deleteFailed && (
        <p role="alert" className="w-full text-ink">
          {copy.mypage.deleteFailed}
        </p>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setConfirmOpen(false)}
        className="w-[min(90vw,26rem)] rounded-md border border-line bg-white p-6 text-ink backdrop:bg-ink/40"
      >
        <p className="leading-relaxed">{copy.auth.deleteConfirm}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
            className="rounded-md border border-line bg-white px-3 py-2 text-ink transition-colors hover:bg-surface disabled:opacity-40"
          >
            {copy.mypage.deleteCancel}
          </button>
          {/* DESIGN-remember: 탈퇴 확정 모달의 주요 버튼 (검정 채움) */}
          <button
            type="button"
            onClick={() => void deleteAccount()}
            disabled={deleting}
            className="rounded-md bg-primary px-3 py-2.5 text-primary-fg hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copy.mypage.deleteSubmit}
          </button>
        </div>
      </dialog>
    </div>
  );
}
