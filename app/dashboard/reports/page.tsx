"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Search,
  BarChart3,
  PieChartIcon,
  Activity,
} from "lucide-react";

// ── Palette ──────────────────────────────────────────────────────────────────
const COLOR_GREEN = "#16a34a";
const COLOR_RED = "#dc2626";
const COLOR_AMBER = "#d97706";
const COLOR_BLUE = "#2563eb";
const COLOR_MUTED = "#e5e7eb";

// ── Custom tooltip for bar/line charts ───────────────────────────────────────
function DollarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">${Number(p.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-background border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p style={{ color: d.payload.fill }} className="font-semibold">
        {d.name}
      </p>
      <p className="text-foreground">
        {d.value} usuario{d.value !== 1 ? "s" : ""} (
        {d.payload.percent !== undefined
          ? (d.payload.percent * 100).toFixed(1)
          : ""}
        %)
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const {
    getAllDebtSummaries,
    payments,
    monthlyCharges,
    isHydrated,
    ratePerHectare,
    members,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  const summaries = getAllDebtSummaries();

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = summaries.reduce((sum, s) => sum + s.totalDebt, 0);
    const totalMonthlyDebt = summaries.reduce(
      (sum, s) => sum + s.monthlyDebt,
      0,
    );
    const totalFineDebt = summaries.reduce((sum, s) => sum + s.fineDebt, 0);
    const usersWithDebt = summaries.filter((s) => !s.isUpToDate).length;
    const usersUpToDate = summaries.filter((s) => s.isUpToDate).length;
    const totalHectares = summaries.reduce((sum, s) => sum + s.hectares, 0);
    return {
      totalCollected,
      totalDebt,
      totalMonthlyDebt,
      totalFineDebt,
      usersWithDebt,
      usersUpToDate,
      totalHectares,
    };
  }, [summaries, payments]);

  // ── Chart: debt per member (bar) ──────────────────────────────────────────
  const debtBarData = useMemo(
    () =>
      summaries
        .filter((s) => s.totalDebt > 0 || s.totalPaid > 0)
        .map((s) => ({
          name: s.memberName.split(" ")[0], // first name to save space
          fullName: s.memberName,
          "Cuotas pendientes": s.monthlyDebt,
          "Multas pendientes": s.fineDebt,
          Pagado: s.totalPaid,
        }))
        .sort(
          (a, b) =>
            b["Cuotas pendientes"] +
            b["Multas pendientes"] -
            (a["Cuotas pendientes"] + a["Multas pendientes"]),
        ),
    [summaries],
  );

  // ── Chart: user status pie ────────────────────────────────────────────────
  const statusPieData = useMemo(
    () => [
      { name: "Al día", value: totals.usersUpToDate, fill: COLOR_GREEN },
      { name: "Con deuda", value: totals.usersWithDebt, fill: COLOR_RED },
    ],
    [totals],
  );

  // ── Chart: monthly collected vs expected (line) ───────────────────────────
  const monthlyLineData = useMemo(() => {
    // Get all months from monthlyCharges
    const months = [...new Set(monthlyCharges.map((c) => c.month))].sort();

    return months.map((month) => {
      const chargesThisMonth = monthlyCharges.filter((c) => c.month === month);
      const expected = chargesThisMonth.reduce((sum, c) => sum + c.amount, 0);
      const collected = chargesThisMonth
        .filter((c) => c.paid)
        .reduce((sum, c) => sum + c.amount, 0);
      const pending = chargesThisMonth
        .filter((c) => !c.paid)
        .reduce((sum, c) => sum + c.amount, 0);

      const [year, m] = month.split("-").map(Number);
      const label = new Date(year, m - 1).toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });

      return {
        month: label,
        Esperado: expected,
        Cobrado: collected,
        Pendiente: pending,
      };
    });
  }, [monthlyCharges]);

  // ── Chart: debt breakdown pie ─────────────────────────────────────────────
  const debtPieData = useMemo(
    () =>
      [
        {
          name: "Cuotas pendientes",
          value: totals.totalMonthlyDebt,
          fill: COLOR_AMBER,
        },
        {
          name: "Multas pendientes",
          value: totals.totalFineDebt,
          fill: COLOR_RED,
        },
        {
          name: "Total recaudado",
          value: totals.totalCollected,
          fill: COLOR_GREEN,
        },
      ].filter((d) => d.value > 0),
    [totals],
  );

  // ── Filtered table ────────────────────────────────────────────────────────
  const filtered = summaries
    .filter((s) => {
      if (filter === "paid") return s.isUpToDate;
      if (filter === "pending") return !s.isUpToDate;
      return true;
    })
    .filter(
      (s) =>
        s.memberName.toLowerCase().includes(search.toLowerCase()) ||
        s.cedula.includes(search),
    );

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen financiero y estado de pagos de todos los usuarios.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recaudado
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totals.totalCollected.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de todos los conceptos
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Total
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              ${totals.totalDebt.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cuotas ${totals.totalMonthlyDebt.toFixed(2)} · Multas $
              {totals.totalFineDebt.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios con Deuda
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Users size={16} className="text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {totals.usersWithDebt}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de {summaries.length} usuarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios al Día
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totals.usersUpToDate}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de {summaries.length} usuarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info strip */}
      <Card className="bg-muted/30">
        <CardContent className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
              Total Hectáreas
            </p>
            <p className="font-bold text-lg mt-0.5">
              {totals.totalHectares.toFixed(2)} ha
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
              Tarifa / ha
            </p>
            <p className="font-bold text-lg mt-0.5">
              ${ratePerHectare.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
              Ingreso Mensual Esperado
            </p>
            <p className="font-bold text-lg mt-0.5 text-primary">
              ${(totals.totalHectares * ratePerHectare).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
              Total Usuarios
            </p>
            <p className="font-bold text-lg mt-0.5">{members.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Charts row 1: Bar + Pie status ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Deuda por usuario — bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              Deuda por Usuario
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Cuotas y multas pendientes vs total pagado
            </p>
          </CardHeader>
          <CardContent>
            {debtBarData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No hay datos de deuda registrados.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={debtBarData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLOR_MUTED} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<DollarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="Cuotas pendientes"
                    stackId="debt"
                    fill={COLOR_AMBER}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Multas pendientes"
                    stackId="debt"
                    fill={COLOR_RED}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Pagado"
                    fill={COLOR_GREEN}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Estado de usuarios — pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon size={16} className="text-primary" />
              Estado de Usuarios
            </CardTitle>
            <p className="text-xs text-muted-foreground">Al día vs con deuda</p>
          </CardHeader>
          <CardContent>
            {summaries.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                Sin usuarios registrados.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  {statusPieData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: d.fill }}
                      />
                      <span className="text-muted-foreground">{d.name}:</span>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2: Line recaudación + Pie distribución ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recaudación mensual — line chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Recaudación Mensual de Cuotas
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Monto esperado vs cobrado por mes
            </p>
          </CardHeader>
          <CardContent>
            {monthlyLineData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No hay cuotas mensuales generadas aún.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={monthlyLineData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLOR_MUTED} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<DollarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line
                    type="monotone"
                    dataKey="Esperado"
                    stroke={COLOR_BLUE}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cobrado"
                    stroke={COLOR_GREEN}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Pendiente"
                    stroke={COLOR_AMBER}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribución financiera — pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Distribución Financiera
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Recaudado vs deudas pendientes
            </p>
          </CardHeader>
          <CardContent>
            {debtPieData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                Sin movimientos financieros.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={debtPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {debtPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {debtPieData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: d.fill }}
                        />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-bold tabular-nums">
                        ${d.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Detail table ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Detalle por Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center px-6 pb-4">
            <div className="relative max-w-sm flex-1">
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
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Con deuda</SelectItem>
                <SelectItem value="paid">Al día</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Usuario</TableHead>
                  <TableHead className="hidden sm:table-cell">Cédula</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    ha
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Cuota/Mes
                  </TableHead>
                  <TableHead className="text-right text-green-700">
                    Pagado
                  </TableHead>
                  <TableHead className="text-right text-amber-700">
                    Deuda Cuotas
                  </TableHead>
                  <TableHead className="text-right text-red-700">
                    Deuda Multas
                  </TableHead>
                  <TableHead className="text-right">Deuda Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.memberId}>
                      <TableCell className="font-medium">
                        {s.memberName}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs hidden sm:table-cell">
                        {s.cedula}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                        {s.hectares.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                        ${s.monthlyRate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ${s.totalPaid.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        ${s.monthlyDebt.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ${s.fineDebt.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {s.totalDebt > 0 ? (
                          <span className="text-destructive">
                            ${s.totalDebt.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-green-600">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.isUpToDate ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 text-xs"
                          >
                            Al día
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
