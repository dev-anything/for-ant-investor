import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/globals.css';
import { AppHeader } from '@/components/AppHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

// DEV_PLAN 0b, FS 7장: 공통 레이아웃 (서버 컴포넌트)
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="flex min-h-full flex-col bg-white text-neutral-900 antialiased">
        <AppHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
