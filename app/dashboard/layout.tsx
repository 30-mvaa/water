'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { SidebarNav } from '@/components/sidebar-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isHydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, isHydrated, router]);

  if (!isHydrated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 bg-background overflow-auto">{children}</main>
    </div>
  );
}
