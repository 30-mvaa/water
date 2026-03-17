'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import type { PaymentConcept } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Receipt, Calendar, Gavel } from 'lucide-react';

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TODAY = new Date().toISOString().split('T')[0];

export function PaymentFormDialog({ open, onOpenChange }: PaymentFormDialogProps) {
  const {
    members,
    events,
    getUnpaidMonthlyCharges,
    getUnpaidFines,
    getMemberDebtSummary,
    addPayment,
  } = useApp();
  const router = useRouter();

  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState(TODAY);
  const [description, setDescription] = useState('');
  const [selectedMonthlyIds, setSelectedMonthlyIds] = useState<string[]>([]);
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setMemberId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setSelectedMonthlyIds([]);
      setSelectedFineIds([]);
      setCustomAmount('');
      setErrors({});
    }
  }, [open]);

  // Get member debt info
  const unpaidMonthly = memberId ? getUnpaidMonthlyCharges(memberId) : [];
  const unpaidFines = memberId ? getUnpaidFines(memberId) : [];
  const debtSummary = memberId ? getMemberDebtSummary(memberId) : null;

  // Calculate selected totals
  const selectedMonthlyTotal = unpaidMonthly
    .filter((c) => selectedMonthlyIds.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  const selectedFinesTotal = unpaidFines
    .filter((f) => selectedFineIds.includes(f.id))
    .reduce((sum, f) => sum + f.fineAmount, 0);

  const totalToPay = selectedMonthlyTotal + selectedFinesTotal + (parseFloat(customAmount) || 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!memberId) e.memberId = 'Selecciona un usuario.';
    if (!date) e.date = 'La fecha es obligatoria.';
    if (totalToPay <= 0) e.amount = 'Selecciona al menos un concepto o ingresa un monto.';
    return e;
  };

  const handleToggleMonthly = (id: string) => {
    setSelectedMonthlyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleFine = (id: string) => {
    setSelectedFineIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllMonthly = () => {
    if (selectedMonthlyIds.length === unpaidMonthly.length) {
      setSelectedMonthlyIds([]);
    } else {
      setSelectedMonthlyIds(unpaidMonthly.map((c) => c.id));
    }
  };

  const handleSelectAllFines = () => {
    if (selectedFineIds.length === unpaidFines.length) {
      setSelectedFineIds([]);
    } else {
      setSelectedFineIds(unpaidFines.map((f) => f.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const member = members.find((m) => m.id === memberId)!;

    // Determine concept based on what's being paid
    let concept: PaymentConcept = 'other';
    let desc = description;

    if (selectedMonthlyIds.length > 0 && selectedFineIds.length === 0 && !customAmount) {
      concept = 'monthly';
      desc = desc || `Pago de ${selectedMonthlyIds.length} cuota(s) mensual(es)`;
    } else if (selectedFineIds.length > 0 && selectedMonthlyIds.length === 0 && !customAmount) {
      concept = 'event_fine';
      desc = desc || `Pago de ${selectedFineIds.length} multa(s) por inasistencia`;
    } else {
      desc = desc || 'Pago combinado';
    }

    const payment = addPayment({
      memberId,
      memberName: member.name,
      concept,
      description: desc,
      amount: totalToPay,
      date,
      monthlyChargeIds: selectedMonthlyIds.length > 0 ? selectedMonthlyIds : undefined,
      attendanceIds: selectedFineIds.length > 0 ? selectedFineIds : undefined,
    });

    onOpenChange(false);
    router.push(`/dashboard/payments/${payment.id}`);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const d = new Date(parseInt(year), parseInt(m) - 1);
    return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Selecciona el usuario y los conceptos a pagar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* User select */}
          <div className="space-y-1.5">
            <Label htmlFor="p-member">Usuario *</Label>
            <Select
              value={memberId}
              onValueChange={(v) => {
                setMemberId(v);
                setSelectedMonthlyIds([]);
                setSelectedFineIds([]);
                setErrors({});
              }}
            >
              <SelectTrigger id="p-member">
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
            {errors.memberId && (
              <p className="text-xs text-destructive">{errors.memberId}</p>
            )}
          </div>

          {/* Debt Summary */}
          {debtSummary && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  Resumen de Deuda
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cuotas</p>
                  <p className="font-semibold text-amber-600">
                    ${debtSummary.monthlyDebt.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {debtSummary.unpaidMonths} mes(es)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Multas</p>
                  <p className="font-semibold text-amber-600">
                    ${debtSummary.fineDebt.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {debtSummary.unpaidFines} multa(s)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Deuda</p>
                  <p className="font-bold text-lg text-destructive">
                    ${debtSummary.totalDebt.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Charges Selection */}
          {unpaidMonthly.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Calendar size={14} />
                  Cuotas Mensuales Pendientes
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllMonthly}
                >
                  {selectedMonthlyIds.length === unpaidMonthly.length
                    ? 'Deseleccionar todo'
                    : 'Seleccionar todo'}
                </Button>
              </div>
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {unpaidMonthly.map((charge) => (
                  <label
                    key={charge.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMonthlyIds.includes(charge.id)}
                      onCheckedChange={() => handleToggleMonthly(charge.id)}
                    />
                    <span className="flex-1 text-sm">
                      {formatMonth(charge.month)}
                    </span>
                    <span className="font-medium">${charge.amount.toFixed(2)}</span>
                  </label>
                ))}
              </div>
              {selectedMonthlyIds.length > 0 && (
                <p className="text-sm text-right">
                  Subtotal: <span className="font-medium">${selectedMonthlyTotal.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* Fines Selection */}
          {unpaidFines.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Gavel size={14} />
                  Multas por Inasistencia
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllFines}
                >
                  {selectedFineIds.length === unpaidFines.length
                    ? 'Deseleccionar todo'
                    : 'Seleccionar todo'}
                </Button>
              </div>
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {unpaidFines.map((fine) => {
                  const event = events.find((e) => e.id === fine.eventId);
                  return (
                    <label
                      key={fine.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedFineIds.includes(fine.id)}
                        onCheckedChange={() => handleToggleFine(fine.id)}
                      />
                      <span className="flex-1 text-sm">
                        {event?.name || 'Evento desconocido'}
                        <span className="text-muted-foreground ml-1">
                          ({event?.date ? new Date(event.date).toLocaleDateString('es-ES') : '-'})
                        </span>
                      </span>
                      <span className="font-medium">${fine.fineAmount.toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
              {selectedFineIds.length > 0 && (
                <p className="text-sm text-right">
                  Subtotal: <span className="font-medium">${selectedFinesTotal.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* Custom Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="p-custom">Monto Adicional ($)</Label>
            <Input
              id="p-custom"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opcional: para pagos que no corresponden a cuotas o multas.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descripción</Label>
            <Textarea
              id="p-desc"
              placeholder="Descripción opcional del pago..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="p-date">Fecha *</Label>
            <Input
              id="p-date"
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
              <span className="text-sm font-medium">Total a Pagar</span>
              <span className="text-2xl font-bold text-primary">
                ${totalToPay.toFixed(2)}
              </span>
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive mt-1">{errors.amount}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={totalToPay <= 0}>
              <Receipt size={16} className="mr-2" />
              Registrar y Ver Recibo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
