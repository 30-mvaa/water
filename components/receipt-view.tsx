"use client";

import { useApp } from "@/lib/app-context";
import type { Payment } from "@/lib/types";
import { CONCEPT_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ReceiptViewProps {
  payment: Payment;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMonth(monthStr: string) {
  const [year, m] = monthStr.split("-").map(Number);
  return new Date(year, m - 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

export function ReceiptView({ payment }: ReceiptViewProps) {
  const { members, events, monthlyCharges, attendances, ratePerHectare } =
    useApp();

  const member = members.find((m) => m.id === payment.memberId);

  // Resolve monthly charge line items
  const monthlyLineItems = (payment.monthlyChargeIds ?? [])
    .map((id) => monthlyCharges.find((c) => c.id === id))
    .filter(Boolean) as typeof monthlyCharges;

  // Resolve fine line items
  const fineLineItems = (payment.attendanceIds ?? [])
    .map((id) => {
      const att = attendances.find((a) => a.id === id);
      if (!att) return null;
      const event = events.find((e) => e.id === att.eventId);
      return { att, event };
    })
    .filter(Boolean) as {
    att: (typeof attendances)[0];
    event: (typeof events)[0] | undefined;
  }[];

  const isMonthly = payment.concept === "monthly";
  const isFine = payment.concept === "event_fine";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar – hidden on print */}
      <div className="no-print flex items-center justify-between px-6 py-4 bg-background border-b border-border print:hidden">
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Pagos
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer size={16} />
          Imprimir Recibo
        </Button>
      </div>

      {/* Receipt */}
      <div className="flex-1 flex items-start justify-center p-6 print:p-0 print:block">
        <div
          id="receipt"
          className="bg-background w-full max-w-lg rounded-2xl border border-border shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border-none print:max-w-full"
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-8 py-7 text-center">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={26} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Recibo de Pago
            </h1>
            <p className="text-primary-foreground/75 text-sm mt-1">
              Sistema de Gestión — PayManager
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Receipt number & date */}
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-1">
                  No. Recibo
                </p>
                <p className="font-mono font-bold text-foreground text-base">
                  {payment.receiptNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-1">
                  Fecha de Pago
                </p>
                <p className="text-foreground font-semibold">
                  {formatDate(payment.date)}
                </p>
              </div>
            </div>

            {/* Member info */}
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                Pagado Por
              </p>
              <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-2">
                <p className="text-foreground font-bold text-xl">
                  {payment.memberName}
                </p>
                {member && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground/70">
                        Cédula:
                      </span>{" "}
                      <span className="font-mono">{member.cedula}</span>
                    </div>
                    {member.phone && (
                      <div>
                        <span className="font-medium text-foreground/70">
                          Teléfono:
                        </span>{" "}
                        {member.phone}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-foreground/70">
                        Hectáreas:
                      </span>{" "}
                      <span className="font-semibold text-foreground">
                        {member.land.hectares.toFixed(2)} ha
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground/70">
                        Sector:
                      </span>{" "}
                      {member.land.location}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Concept */}
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                Concepto
              </p>
              <p className="text-foreground font-semibold text-base">
                {CONCEPT_LABELS[payment.concept]}
              </p>
              {payment.description && (
                <p className="text-sm text-muted-foreground">
                  {payment.description}
                </p>
              )}
            </div>

            {/* Detail table */}
            <div className="border border-border rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="bg-muted/60 px-4 py-2.5 grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="col-span-7">Descripción</span>
                <span className="col-span-2 text-right hidden sm:block">
                  Cant.
                </span>
                <span className="col-span-5 sm:col-span-3 text-right">
                  Monto
                </span>
              </div>

              <div className="divide-y divide-border">
                {/* Monthly charges */}
                {isMonthly && monthlyLineItems.length > 0 && (
                  <>
                    {/* Rate info row */}
                    {member && (
                      <div className="px-4 py-2 bg-blue-50/60 text-xs text-blue-700 flex items-center gap-2">
                        <span className="font-semibold">Tarifa aplicada:</span>
                        <span>
                          {member.land.hectares.toFixed(2)} ha × $
                          {(
                            monthlyLineItems[0]?.amount / member.land.hectares
                          ).toFixed(2)}
                          /ha
                        </span>
                        <span className="ml-auto font-semibold">
                          = ${monthlyLineItems[0]?.amount.toFixed(2)}/mes
                        </span>
                      </div>
                    )}
                    {monthlyLineItems.map((charge) => (
                      <div
                        key={charge.id}
                        className="px-4 py-3.5 grid grid-cols-12 items-center"
                      >
                        <div className="col-span-7">
                          <p className="text-sm font-medium text-foreground capitalize">
                            Cuota — {formatMonth(charge.month)}
                          </p>
                          {member && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {member.land.hectares.toFixed(2)} ha × $
                              {(charge.amount / member.land.hectares).toFixed(
                                2,
                              )}
                              /ha
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-sm text-muted-foreground hidden sm:block">
                          1 mes
                        </div>
                        <div className="col-span-5 sm:col-span-3 text-right">
                          <span className="text-sm font-semibold text-foreground">
                            ${charge.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Fine items */}
                {isFine &&
                  fineLineItems.length > 0 &&
                  fineLineItems.map(({ att, event }) => (
                    <div
                      key={att.id}
                      className="px-4 py-3.5 grid grid-cols-12 items-center"
                    >
                      <div className="col-span-7">
                        <p className="text-sm font-medium text-foreground">
                          Multa por Inasistencia
                        </p>
                        {event && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Evento: {event.name}
                          </p>
                        )}
                        {event?.date && (
                          <p className="text-xs text-muted-foreground">
                            Fecha evento: {formatDate(event.date)}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-sm text-muted-foreground hidden sm:block">
                        1 multa
                      </div>
                      <div className="col-span-5 sm:col-span-3 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          ${att.fineAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Fallback for 'other' concept or no line items */}
                {!isMonthly && !isFine && (
                  <div className="px-4 py-3.5 flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">
                      {payment.description || CONCEPT_LABELS[payment.concept]}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      ${payment.amount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {isMonthly && monthlyLineItems.length > 1 && (
              <div className="text-sm text-muted-foreground text-right -mt-2">
                {monthlyLineItems.length} cuota
                {monthlyLineItems.length !== 1 ? "s" : ""} × $
                {member
                  ? (payment.amount / monthlyLineItems.length).toFixed(2)
                  : "—"}{" "}
                c/u
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center bg-primary/5 rounded-xl px-5 py-4 border border-primary/20">
              <div>
                <span className="font-bold text-foreground text-lg">
                  Total Pagado
                </span>
                {isMonthly && monthlyLineItems.length > 0 && member && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {monthlyLineItems.length} mes
                    {monthlyLineItems.length !== 1 ? "es" : ""} ·{" "}
                    {member.land.hectares.toFixed(2)} ha
                  </p>
                )}
                {isFine && fineLineItems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fineLineItems.length} multa
                    {fineLineItems.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <span className="text-2xl font-bold text-primary tabular-nums">
                ${payment.amount.toFixed(2)}
              </span>
            </div>

            {/* Signature section */}
            <div className="grid grid-cols-2 gap-8 pt-4 pb-2">
              <div className="text-center">
                <div className="border-b border-foreground/30 mb-2 h-10" />
                <p className="text-xs text-muted-foreground">
                  Firma del Cobrador
                </p>
              </div>
              <div className="text-center">
                <div className="border-b border-foreground/30 mb-2 h-10" />
                <p className="text-xs text-muted-foreground">
                  Firma del Usuario
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-1 space-y-1 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Gracias por su pago. Guarde este recibo como comprobante.
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono">
                {payment.receiptNumber} · {formatDate(payment.date)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
