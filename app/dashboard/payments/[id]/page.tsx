'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { ReceiptView } from '@/components/receipt-view';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const { payments, currentUser, isHydrated } = useApp();
  const router = useRouter();

  const payment = payments.find((p) => p.id === params.id);

  useEffect(() => {
    if (!isHydrated) return;
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (!payment) {
      router.replace('/dashboard/payments');
    }
  }, [currentUser, isHydrated, payment, router]);

  if (!isHydrated || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <ReceiptView payment={payment} />;
}
