'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import type { Member, LandDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

interface FormData {
  cedula: string;
  name: string;
  email: string;
  phone: string;
  hectares: string;
  location: string;
  description: string;
}

const EMPTY_FORM: FormData = {
  cedula: '',
  name: '',
  email: '',
  phone: '',
  hectares: '',
  location: '',
  description: '',
};

export function MemberDialog({ open, onOpenChange, member }: MemberDialogProps) {
  const { addMember, updateMember, ratePerHectare } = useApp();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData> & { general?: string }>({});

  useEffect(() => {
    if (open) {
      setForm(
        member
          ? {
              cedula: member.cedula,
              name: member.name,
              email: member.email,
              phone: member.phone,
              hectares: String(member.land.hectares),
              location: member.land.location,
              description: member.land.description,
            }
          : EMPTY_FORM
      );
      setErrors({});
    }
  }, [open, member]);

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!form.cedula.trim()) newErrors.cedula = 'La cédula es obligatoria.';
    else if (!/^\d{6,15}$/.test(form.cedula.trim()))
      newErrors.cedula = 'La cédula debe tener entre 6 y 15 dígitos.';
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!form.email.trim()) newErrors.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Ingresa un correo válido.';
    if (!form.phone.trim()) newErrors.phone = 'El teléfono es obligatorio.';
    if (!form.hectares.trim()) newErrors.hectares = 'Las hectáreas son obligatorias.';
    else if (isNaN(parseFloat(form.hectares)) || parseFloat(form.hectares) <= 0)
      newErrors.hectares = 'Ingresa un número válido mayor a 0.';
    if (!form.location.trim()) newErrors.location = 'La ubicación es obligatoria.';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const land: LandDetails = {
      hectares: parseFloat(form.hectares),
      location: form.location.trim(),
      description: form.description.trim(),
    };

    const memberData = {
      cedula: form.cedula.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      land,
    };

    let error: string | null;
    if (member) {
      error = updateMember(member.id, memberData);
    } else {
      error = addMember(memberData);
    }
    if (error) {
      setErrors({ general: error });
      return;
    }
    onOpenChange(false);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general)
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const calculatedRate = form.hectares && !isNaN(parseFloat(form.hectares))
    ? (parseFloat(form.hectares) * ratePerHectare).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Editar Usuario' : 'Agregar Usuario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {errors.general}
            </p>
          )}
          
          {/* Personal Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
              Información Personal
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-cedula">Cédula *</Label>
                <Input
                  id="m-cedula"
                  placeholder="1234567890"
                  value={form.cedula}
                  onChange={(e) => handleChange('cedula', e.target.value.replace(/\D/g, ''))}
                />
                {errors.cedula && (
                  <p className="text-xs text-destructive">{errors.cedula}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-name">Nombre Completo *</Label>
                <Input
                  id="m-name"
                  placeholder="Juan Pérez"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-email">Correo Electrónico *</Label>
                <Input
                  id="m-email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-phone">Teléfono *</Label>
                <Input
                  id="m-phone"
                  type="tel"
                  placeholder="555-0100"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Land Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
              Detalle del Terreno
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-hectares">Hectáreas *</Label>
                <Input
                  id="m-hectares"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="5"
                  value={form.hectares}
                  onChange={(e) => handleChange('hectares', e.target.value)}
                />
                {errors.hectares && (
                  <p className="text-xs text-destructive">{errors.hectares}</p>
                )}
                {form.hectares && !errors.hectares && (
                  <p className="text-xs text-muted-foreground">
                    Cuota mensual: ${calculatedRate} (${ratePerHectare}/ha)
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-location">Ubicación *</Label>
                <Input
                  id="m-location"
                  placeholder="Sector Norte, Lote 12"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-description">Descripción del Terreno</Label>
              <Textarea
                id="m-description"
                placeholder="Terreno con acceso a riego, pendiente moderada..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{member ? 'Guardar' : 'Agregar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
