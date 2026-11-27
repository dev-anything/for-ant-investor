'use client';

// FS 9-13 NotificationList (클라이언트, 초기값은 서버에서): 마이페이지 알림 칸 (PRD F-13).
// 읽지 않은 줄은 "새 알림" 글자와 굵게로 구분한다 (색만으로 구분하지 않음).
// 줄을 누르면 읽음 표시를 보내고 기다리지 않고 종목 화면으로 간다.
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { copy } from '@/lib/copy';
import type { NotificationEntry } from '@/lib/data/mypage';
import { formatNotifyDate } from '@/lib/notify';

interface NotificationListProps {
  initial: NotificationEntry[];
}

export function NotificationList({ initial }: NotificationListProps) {
  // 이 화면에서 누른 알림은 서버 값과 상관없이 읽은 것으로 보인다
  const [readIds, setReadIds] = useState<ReadonlySet<number>>(() => new Set());

  if (initial.length === 0) return <EmptyState message={copy.mypage.noNotification} />;

  function markRead(id: number): void {
    setReadIds((prev) => new Set(prev).add(id));
    // 응답을 기다리지 않는다. keepalive로 이동 중에도 요청이 끝까지 나가게 한다 (FS 9-13)
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH', keepalive: true }).catch((error: unknown) => {
      console.warn('알림 읽음 처리 실패', error instanceof Error ? error.name : '');
    });
  }

  return (
    <ul className="divide-y divide-line rounded border border-line bg-white">
      {initial.map((entry) => {
        const unread = entry.unread && !readIds.has(entry.id);
        const content = (
          <>
            <p className="flex items-center gap-2 text-xs text-ink-sub">
              {unread && <span className="font-bold text-ink">{copy.mypage.newBadge}</span>}
              <span>{formatNotifyDate(entry.createdAt)}</span>
            </p>
            <p className={`mt-1 whitespace-pre-line text-sm text-ink ${unread ? 'font-bold' : ''}`}>{entry.body}</p>
          </>
        );
        // 종목 화면이 없는 알림(목록에서 빠짐 등)은 링크 없이 보여 준다
        return (
          <li key={entry.id}>
            {entry.shortCode === null ? (
              <div className="px-4 py-3">{content}</div>
            ) : (
              <Link
                href={`/stocks/${entry.shortCode}`}
                onClick={() => markRead(entry.id)}
                className="block px-4 py-3 transition-colors hover:bg-surface"
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
