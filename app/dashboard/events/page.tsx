'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import type { CommunityEvent } from '@/lib/types';
import { EVENT_TYPE_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EventDialog } from '@/components/event-dialog';
import { AttendanceDialog } from '@/components/attendance-dialog';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ClipboardList } from 'lucide-react';

export default function EventsPage() {
  const { events, attendances, deleteEvent, isHydrated } = useApp();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEdit = (event: CommunityEvent) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleAttendance = (event: CommunityEvent) => {
    setSelectedEvent(event);
    setAttendanceDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteEvent(deleteId);
      setDeleteId(null);
    }
  };

  const getEventStats = (eventId: string) => {
    const eventAttendances = attendances.filter((a) => a.eventId === eventId);
    const attended = eventAttendances.filter((a) => a.attended).length;
    const absent = eventAttendances.filter((a) => !a.attended).length;
    const finesPaid = eventAttendances.filter((a) => a.finePaid).length;
    const finesPending = eventAttendances.filter((a) => a.fineGenerated && !a.finePaid).length;
    return { total: eventAttendances.length, attended, absent, finesPaid, finesPending };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Eventos y Trabajos Comunitarios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona reuniones y trabajos. La inasistencia genera multas automáticas.
          </p>
        </div>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus size={16} className="mr-2" />
          Crear Evento
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar evento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Multa</TableHead>
              <TableHead className="text-center">Asistieron</TableHead>
              <TableHead className="text-center">Multas Pendientes</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  {search
                    ? 'No se encontraron eventos.'
                    : 'No hay eventos registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((event) => {
                const stats = getEventStats(event.id);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EVENT_TYPE_LABELS[event.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(event.date).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right">
                      ${event.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600">{stats.attended}</span>
                      <span className="text-muted-foreground">/{stats.total}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.finesPending > 0 ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {stats.finesPending}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAttendance(event)}>
                            <ClipboardList size={14} className="mr-2" />
                            Lista de Asistencia
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(event)}>
                            <Pencil size={14} className="mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(event.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
      />

      <AttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        event={selectedEvent}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el evento y todos los registros de asistencia asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
