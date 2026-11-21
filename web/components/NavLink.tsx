'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isActivePath } from '@/lib/nav';

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

// FS 7장 AppHeader: 메뉴 링크 하나. 현재 경로를 알아야 해서 클라이언트 컴포넌트로 분리 (헤더 나머지는 서버 컴포넌트 유지)
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`transition-colors ${
        isActive ? 'font-bold text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
      }`}
    >
      {children}
    </Link>
  );
}
