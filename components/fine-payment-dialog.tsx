"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Gavel, Receipt } from "lucide-react";

interface FinePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
}

const TODAY = new Date().toISOString().split("T")[0];

export function FinePaymentDialog({
  open,
  onOpenChange,
  memberId: propMemberId,
}: FinePaymentDialogProps) {
  const { members, events, getUnpaidFines, addPayment } = useApp();
  const router = useRouter();

  const [selectedMemberId, setSelectedMemberId] = useState(propMemberId ?? "");
  const [date, setDate] = useState(TODAY);
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync internal state when prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setSelectedMemberId(propMemberId ?? "");
      setDate(new Date().toISOString().split("T")[0]);
      setSelectedFineIds([]);
      setErrors({});
    }
  }, [open, propMemberId]);

  const rawUnpaidFines = selectedMemberId
    ? getUnpaidFines(selectedMemberId)
    : [];

  // If fineAmount stored in attendance is 0, fall back to the event's current amount
  const unpaidFines = rawUnpaidFines.map((fine) => {
    const relatedEvent = events.find((ev) => ev.id === fine.eventId);
    const resolvedAmount =
      fine.fineAmount > 0 ? fine.fineAmount : (relatedEvent?.amount ?? 0);
    return { ...fine, fineAmount: resolvedAmount, _event: relatedEvent };
  });

  const totalToPay = unpaidFines
    .filter((f) => selectedFineIds.includes(f.id))
    .reduce((sum, f) => sum + f.fineAmount, 0);

  const allSelected =
    unpaidFines.length > 0 && selectedFineIds.length === unpaidFines.length;

  const handleToggleFine = (id: string) => {
    setSelectedFineIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedFineIds([]);
    } else {
      setSelectedFineIds(unpaidFines.map((f) => f.id));
    }
  };

  const handleMemberChange = (value: string) => {
    setSelectedMemberId(value);
    setSelectedFineIds([]);
    setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMemberId) e.memberId = "Selecciona un usuario.";
    if (!date) e.date = "La fecha es obligatoria.";
    if (selectedFineIds.length === 0)
      e.fines = "Selecciona al menos una multa para registrar el pago.";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId)!;
    const count = selectedFineIds.length;

    const payment = addPayment({
      memberId: selectedMemberId,
      memberName: member.name,
      concept: "event_fine",
      description: `Pago de ${count} multa${count !== 1 ? "s" : ""} por inasistencia`,
      amount: totalToPay,
      date,
      attendanceIds: selectedFineIds,
    });

    onOpenChange(false);
    router.push(`/dashboard/payments/${payment.id}`);
  };

  const isLocked = Boolean(propMemberId);
  const lockedMember = isLocked
    ? members.find((m) => m.id === propMemberId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel size={18} />
            Registrar Pago de Multas
          </DialogTitle>
          <DialogDescription>
            Selecciona las multas por inasistencia a eventos que deseas saldar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* User select */}
          <div className="space-y-1.5">
            <Label htmlFor="fp-member">Usuario *</Label>
            {isLocked ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/50 text-sm">
                <span className="font-medium">{lockedMember?.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {lockedMember?.cedula}
                </Badge>
              </div>
            ) : (
              <Select
                value={selectedMemberId}
                onValueChange={handleMemberChange}
              >
                <SelectTrigger id="fp-member">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.cedula})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.memberId && (
              <p className="text-xs text-destructive">{errors.memberId}</p>
            )}
          </div>

          {/* Fines list */}
          {selectedMemberId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Gavel size={14} />
                  Multas Pendientes
                  {unpaidFines.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unpaidFines.length}
                    </Badge>
                  )}
                </Label>
                {unpaidFines.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleAll}
                  >
                    {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                  </Button>
                )}
              </div>

              {unpaidFines.filter((f) => f.fineAmount > 0).length === 0 &&
              unpaidFines.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span className="font-medium">Sin multas pendientes ✓</span>
                </div>
              ) : (
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                  {unpaidFines.map((fine) => {
                    const eventName = fine._event?.name ?? "Evento desconocido";
                    const eventDate = fine._event?.date
                      ? new Date(
                          fine._event.date + "T00:00:00",
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";
                    const isChecked = selectedFineIds.includes(fine.id);

                    return (
                      <label
                        key={fine.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleFine(fine.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {eventName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {eventDate}
                          </p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          ${fine.fineAmount.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {errors.fines && (
                <p className="text-xs text-destructive">{errors.fines}</p>
              )}
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="fp-date">Fecha de Pago *</Label>
            <Input
              id="fp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Total */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total a Pagar</p>
                {selectedFineIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedFineIds.length} multa
                    {selectedFineIds.length !== 1 ? "s" : ""} seleccionada
                    {selectedFineIds.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <span className="text-2xl font-bold text-primary">
                ${totalToPay.toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={totalToPay <= 0 || selectedFineIds.length === 0}
            >
              <Receipt size={16} className="mr-2" />
              Registrar y Ver Recibo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
