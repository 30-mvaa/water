'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  const { currentUser, isHydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          aria-label="Cargando"
        />
      </div>
    );
  }

  return <LoginForm />;
}
