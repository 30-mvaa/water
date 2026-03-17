'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { CONCEPT_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaymentFormDialog } from '@/components/payment-form-dialog';
import { Plus, Receipt, Search } from 'lucide-react';
import Link from 'next/link';

const CONCEPT_COLORS: Record<string, string> = {
  monthly: 'bg-blue-100 text-blue-700 border-blue-200',
  event_fine: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function PaymentsPage() {
  const { payments, isHydrated } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = sortedPayments.filter(
    (p) =>
      p.memberName.toLowerCase().includes(search.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pagos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {payments.length} pago{payments.length !== 1 ? 's' : ''} &middot;{' '}
            Total recaudado: <span className="font-medium text-green-600">${totalAmount.toFixed(2)}</span>
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 shrink-0">
          <Plus size={16} aria-hidden="true" />
          Registrar Pago
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre o recibo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                No. Recibo
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Concepto
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Descripción
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Fecha
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Monto
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recibo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  {search
                    ? 'No se encontraron pagos.'
                    : 'No hay pagos registrados.'}
                </td>
              </tr>
            ) : (
              filtered.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {payment.receiptNumber}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {payment.memberName}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CONCEPT_COLORS[payment.concept] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                      {CONCEPT_LABELS[payment.concept]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell max-w-[150px] truncate">
                    {payment.description || '-'}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                    {new Date(payment.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/payments/${payment.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <Receipt size={13} aria-hidden="true" />
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaymentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
