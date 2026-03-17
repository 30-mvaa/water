"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import type { CommunityEvent, Payment } from "@/lib/types";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Returns true if today is strictly after the event date */
function isEventPast(eventDate: string): boolean {
  const [year, month, day] = eventDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > date;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventDialog } from "@/components/event-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ClipboardList,
  Gavel,
  X,
  Receipt,
  UserX,
  CheckCircle2,
  Lock,
  Clock,
} from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const {
    events,
    members,
    attendances,
    deleteEvent,
    getUnpaidFines,
    addPayment,
    isHydrated,
  } = useApp();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Inline fine payment panel state
  const [fineEventId, setFineEventId] = useState<string | null>(null);
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
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
    router.push(`/dashboard/events/${event.id}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteEvent(deleteId);
      if (fineEventId === deleteId) closeFinePanel();
      setDeleteId(null);
    }
  };

  const getEventStats = (eventId: string) => {
    const eventAttendances = attendances.filter((a) => a.eventId === eventId);
    const attended = eventAttendances.filter((a) => a.attended).length;
    const absent = eventAttendances.filter((a) => !a.attended).length;
    const finesPending = eventAttendances.filter(
      (a) => a.fineGenerated && !a.finePaid,
    ).length;
    const pendingAmount = eventAttendances
      .filter((a) => a.fineGenerated && !a.finePaid)
      .reduce((sum, a) => sum + a.fineAmount, 0);
    return {
      total: eventAttendances.length,
      attended,
      absent,
      finesPending,
      pendingAmount,
    };
  };

  // Fine panel helpers
  // All unpaid fines across ALL members for the selected event
  const panelEvent = fineEventId
    ? (events.find((e) => e.id === fineEventId) ?? null)
    : null;

  const panelFines = fineEventId
    ? attendances
        .filter(
          (a) => a.eventId === fineEventId && a.fineGenerated && !a.finePaid,
        )
        .map((a) => {
          const member = members.find((m) => m.id === a.memberId);
          const resolvedAmount =
            a.fineAmount > 0 ? a.fineAmount : (panelEvent?.amount ?? 0);
          return { ...a, fineAmount: resolvedAmount, member };
        })
    : [];

  const panelSelectedFines = panelFines.filter((f) =>
    selectedFineIds.includes(f.id),
  );
  const panelTotal = panelSelectedFines.reduce(
    (sum, f) => sum + f.fineAmount,
    0,
  );
  const allSelected =
    panelFines.length > 0 && selectedFineIds.length === panelFines.length;

  const openFinePanel = (eventId: string) => {
    const fines = attendances.filter(
      (a) => a.eventId === eventId && a.fineGenerated && !a.finePaid,
    );
    setFineEventId(eventId);
    setSelectedFineIds(fines.map((f) => f.id));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayError("");
    setPaying(false);
  };

  const closeFinePanel = () => {
    setFineEventId(null);
    setSelectedFineIds([]);
    setPayError("");
  };

  const toggleFine = (id: string) => {
    setSelectedFineIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
    setPayError("");
  };

  const toggleAllFines = () => {
    if (allSelected) {
      setSelectedFineIds([]);
    } else {
      setSelectedFineIds(panelFines.map((f) => f.id));
    }
    setPayError("");
  };

  const handlePayFines = () => {
    if (selectedFineIds.length === 0) {
      setPayError("Selecciona al menos una multa.");
      return;
    }
    if (!payDate) {
      setPayError("La fecha es obligatoria.");
      return;
    }
    setPaying(true);

    // Group fines by member and create one payment per member
    const byMember: Record<string, typeof panelFines> = {};
    panelSelectedFines.forEach((f) => {
      if (!byMember[f.memberId]) byMember[f.memberId] = [];
      byMember[f.memberId].push(f);
    });

    const paymentIds: string[] = [];
    Object.entries(byMember).forEach(([memberId, fines]) => {
      const member = members.find((m) => m.id === memberId)!;
      const amount = fines.reduce((sum, f) => sum + f.fineAmount, 0);
      const count = fines.length;
      const p = addPayment({
        memberId,
        memberName: member.name,
        concept: "event_fine",
        description: `Pago de ${count} multa${count !== 1 ? "s" : ""} por inasistencia — ${panelEvent?.name}`,
        amount,
        date: payDate,
        attendanceIds: fines.map((f) => f.id),
      });
      paymentIds.push(p.id);
    });

    closeFinePanel();
    if (paymentIds.length > 0) {
      router.push(`/dashboard/payments/${paymentIds[paymentIds.length - 1]}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Eventos y Trabajos Comunitarios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona reuniones y trabajos. La inasistencia genera multas
            automáticas.
          </p>
        </div>
        <Button onClick={handleAdd} className="shrink-0 gap-2">
          <Plus size={16} />
          Crear Evento
        </Button>
      </div>

      {/* Search */}
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

      {/* Main content: table + inline fine panel */}
      <div className="flex gap-5 items-start">
        {/* Events table */}
        <div className="flex-1 min-w-0">
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Multa
                  </TableHead>
                  <TableHead className="text-center">Asistieron</TableHead>
                  <TableHead className="text-center">Multas Pend.</TableHead>
                  <TableHead className="text-center">Cobro Multas</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      {search
                        ? "No se encontraron eventos."
                        : "No hay eventos registrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((event) => {
                    const stats = getEventStats(event.id);
                    const isActivePanel = fineEventId === event.id;
                    return (
                      <TableRow
                        key={event.id}
                        className={isActivePanel ? "bg-amber-50/60" : ""}
                      >
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">
                            {EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          <span
                            className={
                              isEventPast(event.date)
                                ? "text-muted-foreground"
                                : "text-foreground font-medium"
                            }
                          >
                            {new Date(event.date).toLocaleDateString("es-ES")}
                          </span>
                          {!isEventPast(event.date) && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-blue-600">
                              <Clock size={10} />
                              Próximo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell font-medium">
                          ${event.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">
                            {stats.attended}
                          </span>
                          <span className="text-muted-foreground">
                            /{stats.total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {stats.finesPending > 0 ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700"
                            >
                              {stats.finesPending}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              0
                            </span>
                          )}
                        </TableCell>

                        {/* Cobrar multas button */}
                        <TableCell className="text-center">
                          {(() => {
                            const past = isEventPast(event.date);

                            // No pending fines at all
                            if (stats.finesPending === 0) {
                              return (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              );
                            }

                            // Event hasn't passed yet → locked
                            if (!past) {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 cursor-not-allowed"
                                  title="Disponible después de la fecha del evento"
                                >
                                  <Lock size={11} />
                                  Pendiente
                                </span>
                              );
                            }

                            // Event passed → allow cobro
                            if (isActivePanel) {
                              return (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1 text-muted-foreground"
                                  onClick={closeFinePanel}
                                >
                                  <X size={12} />
                                  Cerrar
                                </Button>
                              );
                            }

                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500"
                                onClick={() => openFinePanel(event.id)}
                              >
                                <Gavel size={12} />
                                Cobrar
                              </Button>
                            );
                          })()}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => handleAttendance(event)}
                              title={
                                isEventPast(event.date)
                                  ? "Ver lista de asistencia (cerrada)"
                                  : "Registrar asistencia"
                              }
                            >
                              <ClipboardList size={12} />
                              <span className="hidden lg:inline">
                                {isEventPast(event.date)
                                  ? "Ver lista"
                                  : "Asistencia"}
                              </span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                >
                                  <MoreHorizontal size={15} />
                                  <span className="sr-only">Acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleAttendance(event)}
                                >
                                  <ClipboardList size={14} className="mr-2" />
                                  Lista de Asistencia
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(event)}
                                >
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Inline fine payment panel */}
        {fineEventId && panelEvent && (
          <div className="w-80 shrink-0 sticky top-4">
            <Card className="border-amber-300 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gavel size={16} className="text-amber-600" />
                    Cobrar Multas
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -mr-1"
                    onClick={closeFinePanel}
                  >
                    <X size={15} />
                  </Button>
                </div>
                <div className="mt-1">
                  <p className="text-sm font-medium text-foreground">
                    {panelEvent.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(panelEvent.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · Multa: ${panelEvent.amount.toFixed(2)}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {panelFines.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span className="font-medium">Sin multas pendientes ✓</span>
                  </div>
                ) : (
                  <>
                    {/* Fine list per member */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <UserX size={12} className="text-red-500" />
                          Ausentes con multa
                        </Label>
                        <button
                          type="button"
                          onClick={toggleAllFines}
                          className="text-xs text-primary hover:underline"
                        >
                          {allSelected ? "Quitar todo" : "Seleccionar todo"}
                        </button>
                      </div>
                      <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                        {panelFines.map((fine) => (
                          <label
                            key={fine.id}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedFineIds.includes(fine.id)}
                              onCheckedChange={() => toggleFine(fine.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {fine.member?.name ?? "Desconocido"}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {fine.member?.cedula ?? "—"}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-red-600 tabular-nums shrink-0">
                              ${fine.fineAmount.toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="fine-pay-date"
                        className="text-xs font-medium"
                      >
                        Fecha de pago
                      </Label>
                      <Input
                        id="fine-pay-date"
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Error */}
                    {payError && (
                      <p className="text-xs text-destructive">{payError}</p>
                    )}

                    {/* Total */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total a cobrar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFineIds.length} multa
                          {selectedFineIds.length !== 1 ? "s" : ""} seleccionada
                          {selectedFineIds.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-amber-700 tabular-nums">
                        ${panelTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Submit */}
                    <Button
                      className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={selectedFineIds.length === 0 || paying}
                      onClick={handlePayFines}
                    >
                      <Receipt size={15} />
                      Registrar y Ver Recibo
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el evento y todos los registros de
              asistencia asociados. Esta acción no se puede deshacer.
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
