'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) {
    return (
      <main className="flex-1 w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full sm:gap-4 md:py-0">
        <TopNav />
        <main className="flex-1 items-start p-4 sm:px-6 sm:py-6 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
