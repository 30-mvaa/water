"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import type { EventAttendance } from "@/lib/types";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Search,
  UserCheck,
  UserX,
  Users,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Lock,
  Clock,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import { FinePaymentDialog } from "@/components/fine-payment-dialog";

/** Returns true if today is strictly after the event date (event day is still open) */
function isEventPast(eventDate: string): boolean {
  const [year, month, day] = eventDate.split("-").map(Number);
  const event = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > event;
}

export default function EventAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const {
    events,
    members,
    attendances,
    getAttendanceForEvent,
    initializeAttendance,
    updateAttendance,
    isHydrated,
  } = useApp();

  const [initialized, setInitialized] = useState(false);
  const [search, setSearch] = useState("");
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [selectedFineMemberId, setSelectedFineMemberId] = useState<
    string | undefined
  >(undefined);

  const event = events.find((e) => e.id === eventId);

  // Initialize attendance for all members when the page loads
  useEffect(() => {
    if (isHydrated && event && !initialized) {
      const memberIds = members.map((m) => m.id);
      initializeAttendance(event.id, memberIds);
      setInitialized(true);
    }
  }, [isHydrated, event, members, initializeAttendance, initialized]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Evento no encontrado.</p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/events")}
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a Eventos
        </Button>
      </div>
    );
  }

  const eventAttendances = getAttendanceForEvent(event.id);

  // Merge with members to show all, even if not yet in attendances
  const rows = members
    .map((member) => {
      const attendance = eventAttendances.find((a) => a.memberId === member.id);
      return { member, attendance };
    })
    .filter(
      ({ member }) =>
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.cedula.includes(search),
    );

  // ── Date-based lock ──────────────────────────────────────────────────────────
  // After the event date: attendance is locked, fines become payable
  const eventPast = isEventPast(event.date);

  const attendedCount = eventAttendances.filter((a) => a.attended).length;
  const absentCount = eventAttendances.filter((a) => !a.attended).length;
  const pendingFines = eventAttendances.filter(
    (a) => a.fineGenerated && !a.finePaid,
  ).length;
  const pendingFinesAmount = eventAttendances
    .filter((a) => a.fineGenerated && !a.finePaid)
    .reduce((sum, a) => sum + a.fineAmount, 0);

  const handleToggle = (attendance: EventAttendance) => {
    if (eventPast) return; // locked after event date
    updateAttendance(attendance.id, !attendance.attended);
  };

  const handleCobrarMulta = (memberId: string) => {
    setSelectedFineMemberId(memberId);
    setFineDialogOpen(true);
  };

  // ── Report helpers ────────────────────────────────────────────────────────────

  const formatDateLong = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadCSV = () => {
    const headers = [
      "N°",
      "Nombre",
      "Cédula",
      "Hectáreas",
      "Sector",
      "Asistencia",
      "Estado Multa",
      "Monto Multa ($)",
    ];

    const dataRows = rows.map(({ member, attendance }, index) => {
      const attended = attendance?.attended ?? false;
      const finePaid = attendance?.finePaid ?? false;
      const fineGenerated = attendance?.fineGenerated ?? false;
      const fineAmount = attendance?.fineAmount ?? 0;

      let estadoMulta = "—";
      if (attended) estadoMulta = "Sin multa";
      else if (finePaid) estadoMulta = "Multa pagada";
      else if (fineGenerated) estadoMulta = "Multa pendiente";

      return [
        String(index + 1),
        member.name,
        member.cedula,
        member.land.hectares.toFixed(2),
        member.land.location,
        attended ? "PRESENTE" : "AUSENTE",
        estadoMulta,
        fineGenerated && !attended ? fineAmount.toFixed(2) : "0.00",
      ];
    });

    const totalPresentes = rows.filter((r) => r.attendance?.attended).length;
    const totalAusentes = rows.filter((r) => !r.attendance?.attended).length;
    const totalMultasPendientes = rows.filter(
      (r) =>
        r.attendance?.fineGenerated &&
        !r.attendance?.finePaid &&
        !r.attendance?.attended,
    ).length;
    const totalMontoMultas = rows
      .filter(
        (r) =>
          r.attendance?.fineGenerated &&
          !r.attendance?.finePaid &&
          !r.attendance?.attended,
      )
      .reduce((sum, r) => sum + (r.attendance?.fineAmount ?? 0), 0);

    const csvLines = [
      // Encabezado del reporte
      [`REPORTE DE ASISTENCIA`],
      [`Evento:`, event.name],
      [`Tipo:`, EVENT_TYPE_LABELS[event.type]],
      [`Fecha:`, formatDateLong(event.date)],
      [`Multa por inasistencia:`, `$${event.amount.toFixed(2)}`],
      [`Generado:`, new Date().toLocaleDateString("es-ES")],
      [],
      headers,
      ...dataRows,
      [],
      [`RESUMEN`],
      [`Total usuarios:`, String(rows.length)],
      [`Presentes:`, String(totalPresentes)],
      [`Ausentes:`, String(totalAusentes)],
      [`Multas pendientes:`, String(totalMultasPendientes)],
      [`Total monto multas pendientes:`, `$${totalMontoMultas.toFixed(2)}`],
    ];

    const csvContent = csvLines
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencia_${event.name.replace(/\s+/g, "_")}_${event.date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const totalPresentes = rows.filter((r) => r.attendance?.attended).length;
    const totalAusentes = rows.filter((r) => !r.attendance?.attended).length;
    const totalMultas = rows
      .filter(
        (r) =>
          r.attendance?.fineGenerated &&
          !r.attendance?.finePaid &&
          !r.attendance?.attended,
      )
      .reduce((sum, r) => sum + (r.attendance?.fineAmount ?? 0), 0);

    const rowsHtml = rows
      .map(({ member, attendance }, index) => {
        const attended = attendance?.attended ?? false;
        const finePaid = attendance?.finePaid ?? false;
        const fineGenerated = attendance?.fineGenerated ?? false;
        const fineAmount = attendance?.fineAmount ?? 0;

        let estadoHtml = `<span style="color:#6b7280">—</span>`;
        if (attended)
          estadoHtml = `<span style="color:#16a34a;font-weight:600">Sin multa</span>`;
        else if (finePaid)
          estadoHtml = `<span style="color:#2563eb;font-weight:600">Multa pagada</span>`;
        else if (fineGenerated)
          estadoHtml = `<span style="color:#dc2626;font-weight:600">Pendiente $${fineAmount.toFixed(2)}</span>`;

        const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb";
        return `
          <tr style="background:${bg}">
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${index + 1}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${member.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace">${member.cedula}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${member.land.hectares.toFixed(2)} ha</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">
              ${
                attended
                  ? `<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700">✓ PRESENTE</span>`
                  : `<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700">✗ AUSENTE</span>`
              }
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${estadoHtml}</td>
          </tr>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Reporte de Asistencia — ${event.name}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #111827; padding: 32px; }
          @media print { body { padding: 16px; } .no-print { display: none; } }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; }
          .meta-item { font-size: 13px; }
          .meta-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead tr { background: #1d4ed8; color: white; }
          thead th { padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
          thead th:nth-child(1), thead th:nth-child(4), thead th:nth-child(5), thead th:nth-child(6) { text-align: center; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
          .summary-card { padding: 12px 16px; border-radius: 8px; text-align: center; }
          .summary-card .value { font-size: 28px; font-weight: 800; }
          .summary-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
          .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sign-box { text-align: center; }
          .sign-line { border-bottom: 1px solid #374151; margin-bottom: 6px; height: 48px; }
          .sign-label { font-size: 11px; color: #6b7280; }
          .generated { text-align: right; font-size: 11px; color: #9ca3af; margin-top: 24px; }
        </style>
      </head>
      <body>
        <h1>Reporte de Asistencia</h1>
        <p class="subtitle">Sistema de Gestión — PayManager</p>

        <div class="meta-grid">
          <div class="meta-item"><div class="meta-label">Evento</div><strong>${event.name}</strong></div>
          <div class="meta-item"><div class="meta-label">Tipo</div>${EVENT_TYPE_LABELS[event.type]}</div>
          <div class="meta-item"><div class="meta-label">Fecha</div>${formatDateLong(event.date)}</div>
          <div class="meta-item"><div class="meta-label">Multa por inasistencia</div><strong>$${event.amount.toFixed(2)}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Hectáreas</th>
              <th>Asistencia</th>
              <th>Estado Multa</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="summary">
          <div class="summary-card" style="background:#f0fdf4;border:1px solid #bbf7d0">
            <div class="value" style="color:#16a34a">${totalPresentes}</div>
            <div class="label">Presentes</div>
          </div>
          <div class="summary-card" style="background:#fef2f2;border:1px solid #fecaca">
            <div class="value" style="color:#dc2626">${totalAusentes}</div>
            <div class="label">Ausentes</div>
          </div>
          <div class="summary-card" style="background:#fffbeb;border:1px solid #fde68a">
            <div class="value" style="color:#d97706">${rows.length}</div>
            <div class="label">Total</div>
          </div>
          <div class="summary-card" style="background:#fef2f2;border:1px solid #fecaca">
            <div class="value" style="color:#dc2626;font-size:20px">$${totalMultas.toFixed(2)}</div>
            <div class="label">Multas pendientes</div>
          </div>
        </div>

        <div class="footer">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">Firma del Secretario / Administrador</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">Sello de la Organización</div>
          </div>
        </div>

        <div class="generated">
          Generado el ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          — Ref: ${event.id}
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() => router.push("/dashboard/events")}
          >
            <ArrowLeft size={18} />
            <span className="sr-only">Volver</span>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {event.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                &middot; Multa por inasistencia:{" "}
                <span className="font-medium text-foreground">
                  ${event.amount.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Download / Print report button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0">
              <Download size={15} />
              Descargar Reporte
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={downloadCSV} className="gap-2">
              <FileText size={14} />
              Descargar CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={printReport} className="gap-2">
              <Printer size={14} />
              Imprimir / Guardar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users size={13} />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{members.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <UserCheck size={13} className="text-green-600" />
              Asistieron
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <UserX size={13} className="text-red-500" />
              Faltaron
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
          </CardContent>
        </Card>

        <Card className={pendingFines > 0 ? "border-amber-400" : ""}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              Multas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-amber-600">
              {pendingFines}
              {pendingFines > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  (${pendingFinesAmount.toFixed(2)})
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status banner */}
      {eventPast ? (
        <div className="flex items-center gap-3 text-sm bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
          <Lock size={15} className="text-amber-600 shrink-0" />
          <span className="text-amber-800">
            <span className="font-semibold">Lista cerrada.</span> El evento ya
            pasó — no se puede modificar la asistencia. Los ausentes con multa
            pendiente pueden ser cobrados desde la columna{" "}
            <span className="font-semibold">Acción</span>.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 border">
          <Clock size={15} className="shrink-0" />
          <span>
            Haz clic en{" "}
            <span className="text-green-600 font-medium">Presente</span> o{" "}
            <span className="text-red-500 font-medium">Ausente</span> para
            registrar la asistencia. Los ausentes generan una multa de{" "}
            <span className="font-medium text-foreground">
              ${event.amount.toFixed(2)}
            </span>{" "}
            automáticamente. El cobro se habilitará una vez que pase la fecha
            del evento.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead className="hidden sm:table-cell">Hectáreas</TableHead>
              <TableHead className="text-center">Asistencia</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ member, attendance }) => {
                const attended = attendance?.attended ?? false;
                const finePaid = attendance?.finePaid ?? false;
                const fineGenerated = attendance?.fineGenerated ?? false;

                return (
                  <TableRow key={member.id} className="group">
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {member.cedula}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {member.land.hectares} ha
                    </TableCell>

                    {/* Attendance toggle buttons */}
                    <TableCell className="text-center">
                      {attendance ? (
                        eventPast ? (
                          /* ── LOCKED: event already passed ── */
                          <div className="flex items-center justify-center gap-1.5">
                            {attended ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                <UserCheck size={13} />
                                Presente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
                                <UserX size={13} />
                                Ausente
                              </span>
                            )}
                            <span title="Lista cerrada">
                              <Lock
                                size={12}
                                className="text-muted-foreground/50"
                              />
                            </span>
                          </div>
                        ) : (
                          /* ── OPEN: event not yet passed ── */
                          <div className="flex items-center justify-center gap-2">
                            {/* PRESENTE button */}
                            <button
                              onClick={() =>
                                !attended && handleToggle(attendance)
                              }
                              disabled={attended}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                attended
                                  ? "bg-green-500 text-white border-green-500 shadow-sm cursor-default scale-105"
                                  : "bg-white text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 cursor-pointer"
                              }`}
                              title="Marcar como presente"
                            >
                              <UserCheck size={13} />
                              Presente
                            </button>

                            {/* AUSENTE button */}
                            <button
                              onClick={() =>
                                attended && handleToggle(attendance)
                              }
                              disabled={!attended}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                !attended
                                  ? "bg-red-500 text-white border-red-500 shadow-sm cursor-default scale-105"
                                  : "bg-white text-red-500 border-red-300 hover:bg-red-50 hover:border-red-500 cursor-pointer"
                              }`}
                              title="Marcar como ausente"
                            >
                              <UserX size={13} />
                              Ausente
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Cargando...
                        </span>
                      )}
                    </TableCell>

                    {/* Estado / deuda */}
                    <TableCell className="text-center">
                      {attended ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 border-green-200 gap-1"
                        >
                          <CheckCircle2 size={11} />
                          Sin deuda
                        </Badge>
                      ) : finePaid ? (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 border-blue-200"
                        >
                          Multa pagada
                        </Badge>
                      ) : fineGenerated ? (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-700 border-red-200 gap-1"
                        >
                          <AlertTriangle size={11} />
                          Deuda: ${attendance?.fineAmount.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>

                    {/* Acción cobro multa */}
                    <TableCell className="text-center">
                      {!attended && fineGenerated && !finePaid ? (
                        eventPast ? (
                          /* Event passed → cobro habilitado */
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
                            onClick={() => handleCobrarMulta(member.id)}
                          >
                            <CreditCard size={12} />
                            Cobrar
                          </Button>
                        ) : (
                          /* Event not yet passed → cobro bloqueado */
                          <span
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 cursor-not-allowed"
                            title="Disponible después de la fecha del evento"
                          >
                            <Lock size={11} />
                            Pendiente
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Fine Payment Dialog */}
      <FinePaymentDialog
        open={fineDialogOpen}
        onOpenChange={(open) => {
          setFineDialogOpen(open);
          if (!open) setSelectedFineMemberId(undefined);
        }}
        memberId={selectedFineMemberId}
      />
    </div>
  );
}
