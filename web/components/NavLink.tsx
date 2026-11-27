'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isActivePath } from '@/lib/nav';

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

// FS 7장 AppHeader, DESIGN.md 4-2: 메뉴 링크 하나. 현재 메뉴는 ink 굵게, 나머지는 ink-sub
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`transition-colors ${
        isActive ? 'font-bold text-ink' : 'text-ink-sub hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
