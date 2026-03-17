"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  CalendarPlus,
  Search,
  DollarSign,
  Users,
  AlertCircle,
  Settings2,
  Pencil,
  CheckCircle2,
  CreditCard,
  X,
  Receipt,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "paid";

export default function MonthlyChargesPage() {
  const router = useRouter();
  const {
    members,
    monthlyCharges,
    generateMonthlyCharges,
    getUnpaidMonthlyCharges,
    addPayment,
    ratePerHectare,
    updateRatePerHectare,
    isHydrated,
  } = useApp();

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );

  // ── Dialogs ───────────────────────────────────────────────────────────────────
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rateEditOpen, setRateEditOpen] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [rateError, setRateError] = useState("");

  // ── Inline payment panel ──────────────────────────────────────────────────────
  const [payPanelMemberId, setPayPanelMemberId] = useState<string | null>(null);
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
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

  // ── Derived data ──────────────────────────────────────────────────────────────
  const allMonths = useMemo(
    () => [...new Set(monthlyCharges.map((c) => c.month))].sort().reverse(),
    [monthlyCharges],
  );

  const visibleMonths =
    filterMonth === "all"
      ? allMonths
      : allMonths.filter((m) => m === filterMonth);

  const getMonthCharges = (month: string) =>
    monthlyCharges.filter((c) => {
      if (c.month !== month) return false;
      const member = members.find((m) => m.id === c.memberId);
      if (!member) return false;
      if (
        search &&
        !member.name.toLowerCase().includes(search.toLowerCase()) &&
        !member.cedula.includes(search)
      )
        return false;
      if (filterStatus === "pending" && c.paid) return false;
      if (filterStatus === "paid" && !c.paid) return false;
      return true;
    });

  const totalPending = monthlyCharges
    .filter((c) => !c.paid)
    .reduce((sum, c) => sum + c.amount, 0);
  const totalCollected = monthlyCharges
    .filter((c) => c.paid)
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = monthlyCharges.filter((c) => !c.paid).length;

  // ── Payment panel ─────────────────────────────────────────────────────────────
  const panelMember = payPanelMemberId
    ? (members.find((m) => m.id === payPanelMemberId) ?? null)
    : null;
  const panelUnpaidCharges = payPanelMemberId
    ? getUnpaidMonthlyCharges(payPanelMemberId)
    : [];
  const panelSelectedCharges = panelUnpaidCharges.filter((c) =>
    selectedChargeIds.includes(c.id),
  );
  const panelTotal = panelSelectedCharges.reduce((sum, c) => sum + c.amount, 0);
  const allSelected =
    panelUnpaidCharges.length > 0 &&
    selectedChargeIds.length === panelUnpaidCharges.length;

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    generateMonthlyCharges(selectedMonth);
    setGenerateDialogOpen(false);
  };

  const toggleMonthCollapse = (month: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  const collapseAll = () => setCollapsedMonths(new Set(visibleMonths));

  const expandAll = () => setCollapsedMonths(new Set());

  const openPayPanel = (memberId: string) => {
    const unpaid = getUnpaidMonthlyCharges(memberId);
    setPayPanelMemberId(memberId);
    setSelectedChargeIds(unpaid.map((c) => c.id));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayError("");
    setPaying(false);
  };

  const closePayPanel = () => {
    setPayPanelMemberId(null);
    setSelectedChargeIds([]);
    setPayError("");
  };

  const toggleCharge = (id: string) => {
    setSelectedChargeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
    setPayError("");
  };

  const toggleAllCharges = () => {
    setSelectedChargeIds(
      allSelected ? [] : panelUnpaidCharges.map((c) => c.id),
    );
    setPayError("");
  };

  const handlePay = () => {
    if (!panelMember) return;
    if (selectedChargeIds.length === 0) {
      setPayError("Selecciona al menos una cuota.");
      return;
    }
    if (!payDate) {
      setPayError("La fecha es obligatoria.");
      return;
    }
    setPaying(true);
    const count = selectedChargeIds.length;
    const payment = addPayment({
      memberId: panelMember.id,
      memberName: panelMember.name,
      concept: "monthly",
      description: `Pago de ${count} cuota${count !== 1 ? "s" : ""} mensual${count !== 1 ? "es" : ""}`,
      amount: panelTotal,
      date: payDate,
      monthlyChargeIds: selectedChargeIds,
    });
    closePayPanel();
    router.push(`/dashboard/payments/${payment.id}`);
  };

  const handleOpenRateEdit = () => {
    setRateInput(String(ratePerHectare));
    setRateError("");
    setRateEditOpen(true);
  };

  const handleSaveRate = () => {
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed <= 0) {
      setRateError("Ingresa un valor mayor a $0.00.");
      return;
    }
    updateRatePerHectare(parsed);
    setRateEditOpen(false);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  };

  const formatMonthShort = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString("es-ES", {
      month: "short",
      year: "numeric",
    });
  };

  const activeFilters =
    filterMonth !== "all" || filterStatus !== "all" || search.trim() !== "";

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Cuotas Mensuales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Genera y cobra los pagos mensuales basados en hectáreas.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            onClick={handleOpenRateEdit}
            className="gap-2"
          >
            <Settings2 size={15} />
            Tarifa: ${ratePerHectare.toFixed(2)}/ha
          </Button>
          <Button onClick={() => setGenerateDialogOpen(true)} className="gap-2">
            <CalendarPlus size={16} />
            Generar Cuotas
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign size={14} />
              Total Recaudado
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalCollected.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle size={14} />
              Deuda Pendiente
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              ${totalPending.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users size={14} />
              Cuotas Pendientes
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters bar ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={15} className="text-primary" />
          Filtros
          {activeFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilterMonth("all");
                setFilterStatus("all");
              }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Month filter */}
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos los meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {allMonths.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">
                  {formatMonth(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as StatusFilter)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Solo pendientes</SelectItem>
              <SelectItem value="paid">Solo pagados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Collapse controls */}
        {visibleMonths.length > 1 && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <span className="text-xs text-muted-foreground">
              {visibleMonths.length} mes{visibleMonths.length !== 1 ? "es" : ""}{" "}
              visible{visibleMonths.length !== 1 ? "s" : ""}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ChevronDown size={12} />
                Expandir todo
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={collapseAll}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ChevronUp size={12} />
                Colapsar todo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className={`flex gap-5 items-start transition-all duration-300`}>
        {/* Months list */}
        <div className="flex-1 min-w-0 space-y-4">
          {allMonths.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarPlus
                  size={36}
                  className="mx-auto text-gray-200 mb-3"
                />
                <p className="text-muted-foreground font-medium">
                  No hay cuotas generadas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Haz clic en <strong>Generar Cuotas</strong> para crear los
                  cobros del mes.
                </p>
              </CardContent>
            </Card>
          ) : visibleMonths.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No se encontraron cuotas con los filtros actuales.
              </CardContent>
            </Card>
          ) : (
            visibleMonths.map((month) => {
              const monthCharges = getMonthCharges(month);
              const allMonthCharges = monthlyCharges.filter(
                (c) => c.month === month,
              );
              const paidCount = allMonthCharges.filter((c) => c.paid).length;
              const pendingCountMonth = allMonthCharges.filter(
                (c) => !c.paid,
              ).length;
              const isCollapsed = collapsedMonths.has(month);

              // If filtered and nothing to show, skip
              if (
                monthCharges.length === 0 &&
                (search || filterStatus !== "all")
              )
                return null;

              return (
                <Card key={month} className="overflow-hidden">
                  {/* Month header — clickable to collapse */}
                  <CardHeader
                    className="pb-0 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                    onClick={() => toggleMonthCollapse(month)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 py-1">
                      <div className="flex items-center gap-3">
                        {isCollapsed ? (
                          <ChevronDown
                            size={16}
                            className="text-muted-foreground shrink-0"
                          />
                        ) : (
                          <ChevronUp
                            size={16}
                            className="text-muted-foreground shrink-0"
                          />
                        )}
                        <CardTitle className="text-base capitalize">
                          {formatMonth(month)}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          {paidCount} pagado{paidCount !== 1 ? "s" : ""}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700"
                        >
                          {pendingCountMonth} pendiente
                          {pendingCountMonth !== 1 ? "s" : ""}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-1">
                          $
                          {allMonthCharges
                            .reduce((s, c) => s + c.amount, 0)
                            .toFixed(2)}{" "}
                          total
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Collapsible body */}
                  {!isCollapsed && (
                    <CardContent className="p-0 mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead>Usuario</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Cédula
                            </TableHead>
                            <TableHead className="text-right hidden sm:table-cell">
                              Hectáreas
                            </TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-center">
                              Estado
                            </TableHead>
                            <TableHead className="text-center">Cobro</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthCharges.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-6 text-muted-foreground text-sm"
                              >
                                No hay cuotas que coincidan con los filtros.
                              </TableCell>
                            </TableRow>
                          ) : (
                            monthCharges.map((charge) => {
                              const member = members.find(
                                (m) => m.id === charge.memberId,
                              );
                              const isActivePanel =
                                payPanelMemberId === charge.memberId;
                              return (
                                <TableRow
                                  key={charge.id}
                                  className={
                                    isActivePanel ? "bg-primary/5" : ""
                                  }
                                >
                                  <TableCell className="font-medium">
                                    {member?.name || "Desconocido"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground hidden sm:table-cell text-sm font-mono">
                                    {member?.cedula || "-"}
                                  </TableCell>
                                  <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                                    {member?.land.hectares.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${charge.amount.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {charge.paid ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700"
                                      >
                                        Pagado
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        className="bg-amber-100 text-amber-700"
                                      >
                                        Pendiente
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {!charge.paid && member ? (
                                      isActivePanel ? (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs gap-1 text-muted-foreground"
                                          onClick={closePayPanel}
                                        >
                                          <X size={12} />
                                          Cerrar
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
                                          onClick={() =>
                                            openPayPanel(member.id)
                                          }
                                        >
                                          <CreditCard size={12} />
                                          Cobrar
                                        </Button>
                                      )
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Inline payment panel */}
        {payPanelMemberId && panelMember && (
          <div className="w-80 shrink-0 sticky top-4">
            <Card className="border-primary/30 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    Cobrar Cuota
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -mr-1"
                    onClick={closePayPanel}
                  >
                    <X size={15} />
                  </Button>
                </div>
                <div className="mt-1">
                  <p className="text-sm font-medium text-foreground">
                    {panelMember.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {panelMember.cedula} · {panelMember.land.hectares} ha
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {panelUnpaidCharges.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span className="font-medium">
                      Al día — sin cuotas pendientes
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <Calendar size={12} />
                          Cuotas pendientes
                        </Label>
                        <button
                          type="button"
                          onClick={toggleAllCharges}
                          className="text-xs text-primary hover:underline"
                        >
                          {allSelected ? "Quitar todo" : "Seleccionar todo"}
                        </button>
                      </div>
                      <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
                        {panelUnpaidCharges.map((charge) => (
                          <label
                            key={charge.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedChargeIds.includes(charge.id)}
                              onCheckedChange={() => toggleCharge(charge.id)}
                            />
                            <span className="flex-1 text-sm capitalize">
                              {formatMonthShort(charge.month)}
                            </span>
                            <span className="text-sm font-medium tabular-nums">
                              ${charge.amount.toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pay-date" className="text-xs font-medium">
                        Fecha de pago
                      </Label>
                      <Input
                        id="pay-date"
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {payError && (
                      <p className="text-xs text-destructive">{payError}</p>
                    )}

                    <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total a cobrar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedChargeIds.length} cuota
                          {selectedChargeIds.length !== 1 ? "s" : ""}{" "}
                          seleccionada
                          {selectedChargeIds.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-primary tabular-nums">
                        ${panelTotal.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      className="w-full gap-2"
                      disabled={selectedChargeIds.length === 0 || paying}
                      onClick={handlePay}
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

      {/* ── Rate Edit Dialog ── */}
      <Dialog open={rateEditOpen} onOpenChange={setRateEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 size={17} />
              Configurar Tarifa por Hectárea
            </DialogTitle>
            <DialogDescription>
              Define el monto en dólares que se cobra por cada hectárea al
              generar cuotas mensuales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rate-input">Tarifa ($ por hectárea)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="rate-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="4.00"
                  value={rateInput}
                  onChange={(e) => {
                    setRateInput(e.target.value);
                    setRateError("");
                  }}
                  className="pl-7"
                  autoFocus
                />
              </div>
              {rateError && (
                <p className="text-xs text-destructive">{rateError}</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="text-muted-foreground text-xs mb-2">
                Vista previa con esta tarifa:
              </p>
              {members.slice(0, 4).map((m) => {
                const preview = parseFloat(rateInput) || 0;
                return (
                  <div key={m.id} className="flex justify-between text-xs">
                    <span className="text-foreground truncate max-w-30">
                      {m.name}
                    </span>
                    <span className="font-medium tabular-nums text-right">
                      {m.land.hectares} ha × ${preview.toFixed(2)} ={" "}
                      <span className="text-primary">
                        ${(m.land.hectares * preview).toFixed(2)}
                      </span>
                    </span>
                  </div>
                );
              })}
              {members.length > 4 && (
                <p className="text-xs text-muted-foreground pt-1">
                  y {members.length - 4} usuario(s) más…
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRate} className="gap-2">
              <CheckCircle2 size={15} />
              Guardar Tarifa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Dialog ── */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Cuotas Mensuales</DialogTitle>
            <DialogDescription>
              Se crearán cuotas para todos los usuarios activos basadas en sus
              hectáreas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mes a Generar</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuarios activos</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total hectáreas</span>
                <span className="font-medium">
                  {members
                    .reduce((sum, m) => sum + m.land.hectares, 0)
                    .toFixed(2)}{" "}
                  ha
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarifa</span>
                <span className="font-medium">
                  ${ratePerHectare.toFixed(2)}/ha
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 mt-1">
                <span className="font-medium">Total a generar</span>
                <span className="font-bold text-primary">
                  $
                  {(
                    members.reduce((sum, m) => sum + m.land.hectares, 0) *
                    ratePerHectare
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleGenerate}>
              <CalendarPlus size={15} className="mr-2" />
              Generar Cuotas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
