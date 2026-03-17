'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Calendar, CheckCircle2, Receipt, AlertCircle } from 'lucide-react';

interface MonthlyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
}

const TODAY = new Date().toISOString().split('T')[0];

export function MonthlyPaymentDialog({
  open,
  onOpenChange,
  memberId: memberIdProp,
}: MonthlyPaymentDialogProps) {
  const { members, getUnpaidMonthlyCharges, getMemberDebtSummary, addPayment } =
    useApp();
  const router = useRouter();

  const [memberId, setMemberId] = useState(memberIdProp ?? '');
  const [date, setDate] = useState(TODAY);
  const [selectedMonthlyIds, setSelectedMonthlyIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync external memberId prop when dialog opens
  useEffect(() => {
    if (open) {
      setMemberId(memberIdProp ?? '');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedMonthlyIds([]);
      setErrors({});
    }
  }, [open, memberIdProp]);

  // Auto-select all pending charges when member changes
  useEffect(() => {
    if (memberId) {
      const charges = getUnpaidMonthlyCharges(memberId);
      setSelectedMonthlyIds(charges.map((c) => c.id));
    } else {
      setSelectedMonthlyIds([]);
    }
  }, [memberId, getUnpaidMonthlyCharges]);

  const unpaidMonthly = memberId ? getUnpaidMonthlyCharges(memberId) : [];
  const debtSummary = memberId ? getMemberDebtSummary(memberId) : null;
  const isUpToDate = unpaidMonthly.length === 0 && !!memberId;

  const totalToPay = unpaidMonthly
    .filter((c) => selectedMonthlyIds.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  const allSelected =
    unpaidMonthly.length > 0 &&
    selectedMonthlyIds.length === unpaidMonthly.length;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!memberId) e.memberId = 'Selecciona un usuario.';
    if (!date) e.date = 'La fecha es obligatoria.';
    if (memberId && !isUpToDate && selectedMonthlyIds.length === 0)
      e.selection = 'Selecciona al menos una cuota mensual para registrar el pago.';
    return e;
  };

  const handleToggle = (id: string) => {
    setSelectedMonthlyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedMonthlyIds([]);
    } else {
      setSelectedMonthlyIds(unpaidMonthly.map((c) => c.id));
    }
  };

  const handleMemberChange = (value: string) => {
    setMemberId(value);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const member = members.find((m) => m.id === memberId)!;
    const count = selectedMonthlyIds.length;

    const payment = addPayment({
      memberId,
      memberName: member.name,
      concept: 'monthly',
      description: `Pago de ${count} cuota${count !== 1 ? 's' : ''} mensual${count !== 1 ? 'es' : ''}`,
      amount: totalToPay,
      date,
      monthlyChargeIds: selectedMonthlyIds,
    });

    onOpenChange(false);
    router.push(`/dashboard/payments/${payment.id}`);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const d = new Date(parseInt(year), parseInt(m) - 1);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Registrar Pago de Cuota Mensual
          </DialogTitle>
          <DialogDescription>
            Selecciona el usuario y las cuotas mensuales a pagar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* User select */}
          <div className="space-y-1.5">
            <Label htmlFor="mp-member">Usuario *</Label>
            <Select
              value={memberId}
              onValueChange={handleMemberChange}
              disabled={!!memberIdProp}
            >
              <SelectTrigger id="mp-member">
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}{' '}
                    <span className="text-muted-foreground">({m.cedula})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.memberId && (
              <p className="text-xs text-destructive">{errors.memberId}</p>
            )}
          </div>

          {/* Debt summary card */}
          {debtSummary && !isUpToDate && (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle size={14} />
                  Cuotas pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-6 text-sm px-4 pb-3">
                <div>
                  <p className="text-muted-foreground text-xs">Meses adeudados</p>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    {debtSummary.unpaidMonths}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Deuda total</p>
                  <p className="font-bold text-amber-700 dark:text-amber-400">
                    ${debtSummary.monthlyDebt.toFixed(2)}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-400">
                    ${debtSummary.monthlyRate.toFixed(2)}/mes
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Al día message */}
          {isUpToDate && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 py-6 text-green-700 dark:text-green-400">
              <CheckCircle2 size={20} />
              <span className="font-medium">Al día ✓</span>
              <span className="text-sm text-muted-foreground">
                — Este usuario no tiene cuotas mensuales pendientes.
              </span>
            </div>
          )}

          {/* Monthly charges list */}
          {unpaidMonthly.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Cuotas a pagar
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={handleToggleAll}
                >
                  {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </Button>
              </div>

              <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
                {unpaidMonthly.map((charge) => (
                  <label
                    key={charge.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedMonthlyIds.includes(charge.id)}
                      onCheckedChange={() => handleToggle(charge.id)}
                    />
                    <span className="flex-1 text-sm capitalize">
                      {formatMonth(charge.month)}
                    </span>
                    <span className="font-medium text-sm tabular-nums">
                      ${charge.amount.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>

              {errors.selection && (
                <p className="text-xs text-destructive">{errors.selection}</p>
              )}

              {selectedMonthlyIds.length > 0 && (
                <p className="text-xs text-right text-muted-foreground">
                  {selectedMonthlyIds.length} cuota
                  {selectedMonthlyIds.length !== 1 ? 's' : ''} seleccionada
                  {selectedMonthlyIds.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Date */}
          {!isUpToDate && memberId && (
            <div className="space-y-1.5">
              <Label htmlFor="mp-date">Fecha de pago *</Label>
              <Input
                id="mp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>
          )}

          {/* Total */}
          {!isUpToDate && memberId && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total a pagar</span>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  ${totalToPay.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            {!isUpToDate && (
              <Button
                type="submit"
                disabled={selectedMonthlyIds.length === 0 || !memberId}
              >
                <Receipt size={15} className="mr-2" />
                Registrar y Ver Recibo
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
