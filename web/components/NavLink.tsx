'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isActivePath } from '@/lib/nav';

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

// FS 7장 AppHeader, DESIGN.md 2-1: 메뉴 링크 하나. 활성 상태는 굵게 + 아래 2px 갈색 밑줄
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`transition-colors ${
        isActive
          ? 'font-bold text-ink underline decoration-brand decoration-2 underline-offset-4'
          : 'text-ink-sub hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
