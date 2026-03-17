'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import type { CommunityEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX } from 'lucide-react';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CommunityEvent | null;
}

export function AttendanceDialog({ open, onOpenChange, event }: AttendanceDialogProps) {
  const { members, getAttendanceForEvent, initializeAttendance, updateAttendance } = useApp();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (open && event && !initialized) {
      // Initialize attendance for all members when opening the dialog
      const memberIds = members.map((m) => m.id);
      initializeAttendance(event.id, memberIds);
      setInitialized(true);
    }
    if (!open) {
      setInitialized(false);
    }
  }, [open, event, members, initializeAttendance, initialized]);

  if (!event) return null;

  const attendances = getAttendanceForEvent(event.id);
  const attendedCount = attendances.filter((a) => a.attended).length;
  const absentCount = attendances.filter((a) => !a.attended).length;

  const handleToggleAttendance = (attendanceId: string, currentlyAttended: boolean) => {
    updateAttendance(attendanceId, !currentlyAttended);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Lista de Asistencia</DialogTitle>
          <DialogDescription>
            {event.name} - {new Date(event.date).toLocaleDateString('es-ES')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <UserCheck size={16} className="text-green-600" />
            <span>Asistieron: {attendedCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <UserX size={16} className="text-amber-600" />
            <span>Faltaron: {absentCount}</span>
          </div>
          <div className="text-sm text-muted-foreground ml-auto">
            Multa: ${event.amount.toFixed(2)}
          </div>
        </div>

        <div className="border rounded-lg overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-12">Asistió</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados para este evento.
                  </TableCell>
                </TableRow>
              ) : (
                attendances.map((attendance) => {
                  const member = members.find((m) => m.id === attendance.memberId);
                  if (!member) return null;
                  return (
                    <TableRow key={attendance.id}>
                      <TableCell>
                        <Checkbox
                          checked={attendance.attended}
                          onCheckedChange={() =>
                            handleToggleAttendance(attendance.id, attendance.attended)
                          }
                          aria-label={`Marcar asistencia de ${member.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.cedula}</TableCell>
                      <TableCell className="text-right">
                        {attendance.attended ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Asistió
                          </Badge>
                        ) : attendance.finePaid ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Multa Pagada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            Multa: ${attendance.fineAmount.toFixed(2)}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="pt-2">
          <p className="text-xs text-muted-foreground mr-auto">
            Los usuarios no marcados generan multa automáticamente.
          </p>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
