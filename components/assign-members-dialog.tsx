'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import type { CommunityEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AssignMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CommunityEvent | null;
}

export function AssignMembersDialog({
  open,
  onOpenChange,
  event,
}: AssignMembersDialogProps) {
  const { members, assignEventToMembers, getChargesForEvent } = useApp();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && event) {
      const existingCharges = getChargesForEvent(event.id);
      setSelected(existingCharges.map((c) => c.memberId));
    } else {
      setSelected([]);
    }
  }, [open, event, getChargesForEvent]);

  const handleToggle = (memberId: string) => {
    setSelected((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === members.length) {
      setSelected([]);
    } else {
      setSelected(members.map((m) => m.id));
    }
  };

  const handleSubmit = () => {
    if (event) {
      assignEventToMembers(event.id, selected);
    }
    onOpenChange(false);
  };

  if (!event) return null;

  const existingCharges = getChargesForEvent(event.id);
  const existingMemberIds = existingCharges.map((c) => c.memberId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Usuarios a: {event.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">
            Valor por usuario: ${event.amount.toFixed(2)}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              id="select-all"
              checked={selected.length === members.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Seleccionar todos
            </Label>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
            {members.map((member) => {
              const alreadyAssigned = existingMemberIds.includes(member.id);
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={selected.includes(member.id)}
                    onCheckedChange={() => handleToggle(member.id)}
                    disabled={alreadyAssigned}
                  />
                  <Label
                    htmlFor={`member-${member.id}`}
                    className={`text-sm ${alreadyAssigned ? 'text-muted-foreground' : ''}`}
                  >
                    {member.name} ({member.cedula})
                    {alreadyAssigned && (
                      <span className="ml-2 text-xs text-primary">(ya asignado)</span>
                    )}
                  </Label>
                </div>
              );
            })}
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios registrados.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Asignar Cobros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
