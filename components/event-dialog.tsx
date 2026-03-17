'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import type { CommunityEvent, EventType } from '@/lib/types';
import { EVENT_TYPE_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CommunityEvent | null;
}

interface FormData {
  name: string;
  type: EventType;
  date: string;
  amount: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  type: 'meeting',
  date: new Date().toISOString().split('T')[0],
  amount: '',
};

export function EventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const { addEvent, updateEvent } = useApp();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (open) {
      setForm(
        event
          ? {
              name: event.name,
              type: event.type,
              date: event.date,
              amount: String(event.amount),
            }
          : EMPTY_FORM
      );
      setErrors({});
    }
  }, [open, event]);

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!form.date) newErrors.date = 'La fecha es obligatoria.';
    if (!form.amount.trim()) newErrors.amount = 'El valor es obligatorio.';
    else if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) < 0)
      newErrors.amount = 'Ingresa un número válido.';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const eventData = {
      name: form.name.trim(),
      type: form.type,
      date: form.date,
      amount: parseFloat(form.amount),
    };

    if (event) {
      updateEvent(event.id, eventData);
    } else {
      addEvent(eventData);
    }
    onOpenChange(false);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Crear Evento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ev-name">Nombre del Evento *</Label>
            <Input
              id="ev-name"
              placeholder="Reunión mensual, Limpieza de canales..."
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-type">Tipo de Evento *</Label>
            <Select
              value={form.type}
              onValueChange={(val) => handleChange('type', val as EventType)}
            >
              <SelectTrigger id="ev-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-date">Fecha *</Label>
            <Input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-amount">Multa por Inasistencia ($) *</Label>
            <Input
              id="ev-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="25.00"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Este valor se cobrará automáticamente a quienes no asistan.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{event ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
