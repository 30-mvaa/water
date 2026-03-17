'use client';

import { useApp } from '@/lib/app-context';
import type { Payment } from '@/lib/types';
import { CONCEPT_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ReceiptViewProps {
  payment: Payment;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ReceiptView({ payment }: ReceiptViewProps) {
  const { members, events } = useApp();
  
  const handlePrint = () => {
    window.print();
  };

  const member = members.find((m) => m.id === payment.memberId);
  const event =
    payment.concept === 'event' && payment.eventId
      ? events.find((e) => e.id === payment.eventId)
      : null;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar – hidden on print */}
      <div className="no-print flex items-center justify-between px-6 py-4 bg-background border-b border-border">
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a Pagos
        </Link>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} aria-hidden="true" />
          Imprimir Recibo
        </Button>
      </div>

      {/* Receipt content */}
      <div className="flex-1 flex items-start justify-center p-6 print:p-0 print:block">
        <div
          id="receipt"
          className="bg-background w-full max-w-md rounded-2xl border border-border shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border-none print:max-w-full"
        >
          {/* Receipt Header */}
          <div className="bg-primary text-primary-foreground px-8 py-6 text-center">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold">Recibo de Pago</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">PayManager</p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Receipt number & date */}
            <div className="flex items-center justify-between text-sm border-b border-border pb-4">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  No. Recibo
                </p>
                <p className="font-mono font-semibold text-foreground mt-0.5">
                  {payment.receiptNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  Fecha
                </p>
                <p className="text-foreground font-medium mt-0.5">
                  {formatDate(payment.date)}
                </p>
              </div>
            </div>

            {/* Billed to */}
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-1">
                Pagado por
              </p>
              <p className="text-foreground font-semibold text-lg">
                {payment.memberName}
              </p>
              {member && (
                <p className="text-muted-foreground text-sm">
                  Cédula: {member.cedula}
                </p>
              )}
            </div>

            {/* Payment details table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Descripción</span>
                <span>Monto</span>
              </div>
              <div className="px-4 py-3.5 flex justify-between items-center border-t border-border">
                <div>
                  <span className="text-foreground font-medium">
                    {CONCEPT_LABELS[payment.concept]}
                  </span>
                  {event && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.name} - {formatDate(event.date)}
                    </p>
                  )}
                </div>
                <span className="text-foreground font-semibold">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-primary/5 rounded-lg px-4 py-3.5 border border-primary/20">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                ${payment.amount.toFixed(2)}
              </span>
            </div>

            {/* Footer note */}
            <p className="text-center text-sm text-muted-foreground pt-2">
              Gracias por su pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
