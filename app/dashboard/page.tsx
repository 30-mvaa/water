'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { CONCEPT_LABELS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  CreditCard,
  DollarSign,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { members, payments, events, attendances, monthlyCharges, currentUser, isHydrated } =
    useApp();

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const pendingFinesCount = attendances.filter((a: any) => a.fineGenerated && !a.finePaid).length;
  const pendingFinesAmount = useMemo(() => {
    return attendances
      .filter((a: any) => a.fineGenerated && !a.finePaid)
      .reduce((sum: number, attendance: any) => {
        return sum + attendance.fineAmount;
      }, 0);
  }, [attendances]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Usuarios',
      value: String(members.length),
      icon: Users,
      href: '/dashboard/users',
      show: currentUser?.role === 'admin',
    },
    {
      label: 'Total Pagos',
      value: String(payments.length),
      icon: CreditCard,
      href: '/dashboard/payments',
      show: true,
    },
    {
      label: 'Recaudado',
      value: `$${totalAmount.toFixed(2)}`,
      icon: DollarSign,
      href: '/dashboard/payments',
      show: true,
    },
    {
      label: 'Eventos',
      value: String(events.length),
      icon: CalendarDays,
      href: '/dashboard/events',
      show: currentUser?.role === 'admin',
    },
    {
      label: 'Multas Pendientes',
      value: `${pendingFinesCount} ($${pendingFinesAmount.toFixed(2)})`,
      icon: AlertTriangle,
      href: '/dashboard/reports',
      show: currentUser?.role === 'admin',
      highlight: pendingFinesCount > 0,
    },
  ].filter((s) => s.show);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground text-balance">
          Bienvenido, {currentUser?.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen del sistema de gestión de pagos.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  stat.highlight ? 'border-amber-400' : ''
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stat.highlight
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-primary/10'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={stat.highlight ? '' : 'text-primary'}
                      aria-hidden="true"
                    />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-foreground">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Pagos Recientes
          </CardTitle>
          <Link
            href="/dashboard/payments"
            className="text-xs text-primary hover:underline font-medium"
          >
            Ver todos
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay pagos registrados.
            </p>
          ) : (
            <div>
              {recentPayments.map((payment, i) => (
                <Link
                  key={payment.id}
                  href={`/dashboard/payments/${payment.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/50 transition-colors group"
                  style={{
                    borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {payment.memberName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CONCEPT_LABELS[payment.concept]} &middot;{' '}
                      {new Date(payment.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      ${payment.amount.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                      {payment.receiptNumber}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
