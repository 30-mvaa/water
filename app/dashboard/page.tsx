"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/app-context";
import { CONCEPT_LABELS } from "@/lib/types";
import Link from "next/link";
import {
  Users,
  DollarSign,
  CalendarDays,
  AlertTriangle,
  Receipt,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplets,
  BarChart3,
} from "lucide-react";

const CONCEPT_COLORS: Record<string, string> = {
  monthly: "bg-blue-100 text-blue-700",
  event_fine: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const {
    members,
    payments,
    events,
    attendances,
    monthlyCharges,
    currentUser,
    isHydrated,
    ratePerHectare,
  } = useApp();

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [payments],
  );

  const pendingFinesCount = attendances.filter(
    (a) => a.fineGenerated && !a.finePaid,
  ).length;

  const pendingFinesAmount = useMemo(
    () =>
      attendances
        .filter((a) => a.fineGenerated && !a.finePaid)
        .reduce((sum, a) => sum + a.fineAmount, 0),
    [attendances],
  );

  const pendingMonthlyCount = monthlyCharges.filter((c) => !c.paid).length;
  const pendingMonthlyAmount = monthlyCharges
    .filter((c) => !c.paid)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalHectares = members.reduce((sum, m) => sum + m.land.hectares, 0);
  const expectedMonthly = totalHectares * ratePerHectare;

  const upcomingEvents = events
    .filter((e) => {
      const [y, m, d] = e.date.split("-").map(Number);
      const evDate = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return evDate >= today;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center animate-pulse">
            <Droplets size={20} className="text-white" />
          </div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 py-8 md:px-10 md:py-10"
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
        }}
      >
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-6 right-24 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 left-1/3 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Droplets size={16} className="text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium">
                PayManager
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Bienvenido, {currentUser?.name} 👋
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3">
              <TrendingUp size={20} className="text-white/80" />
              <div>
                <p className="text-white/70 text-xs">
                  Ingreso mensual esperado
                </p>
                <p className="text-white font-bold text-lg tabular-nums">
                  ${expectedMonthly.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 md:px-10 space-y-6">
        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total recaudado */}
          <Link href="/dashboard/reports" className="group">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <DollarSign size={18} className="text-white" />
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <p className="text-2xl font-bold text-gray-800 tabular-nums">
                ${totalAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total recaudado</p>
            </div>
          </Link>

          {/* Usuarios */}
          {isAdmin && (
            <Link href="/dashboard/users" className="group">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Users size={18} className="text-white" />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {members.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Usuarios registrados
                </p>
              </div>
            </Link>
          )}

          {/* Eventos */}
          {isAdmin && (
            <Link href="/dashboard/events" className="group">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-sm">
                    <CalendarDays size={18} className="text-white" />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {events.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Eventos creados</p>
              </div>
            </Link>
          )}

          {/* Multas pendientes */}
          {isAdmin && (
            <Link href="/dashboard/reports" className="group">
              <div
                className={`rounded-2xl border shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                  pendingFinesCount > 0
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      pendingFinesCount > 0
                        ? "bg-gradient-to-br from-amber-400 to-orange-500"
                        : "bg-gradient-to-br from-gray-300 to-gray-400"
                    }`}
                  >
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    pendingFinesCount > 0 ? "text-amber-700" : "text-gray-800"
                  }`}
                >
                  {pendingFinesCount}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Multas pendientes
                  {pendingFinesCount > 0 && (
                    <span className="ml-1 font-semibold text-amber-600">
                      · ${pendingFinesAmount.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* ── Alert banners ────────────────────────────────────────────────── */}
        {isAdmin && (pendingFinesCount > 0 || pendingMonthlyCount > 0) && (
          <div className="space-y-2">
            {pendingFinesCount > 0 && (
              <Link href="/dashboard/events">
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      {pendingFinesCount} multa
                      {pendingFinesCount !== 1 ? "s" : ""} pendiente
                      {pendingFinesCount !== 1 ? "s" : ""} de cobro
                    </p>
                    <p className="text-xs text-amber-600">
                      Total: ${pendingFinesAmount.toFixed(2)} — Ve a Eventos
                      para cobrar
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-amber-500 shrink-0" />
                </div>
              </Link>
            )}
            {pendingMonthlyCount > 0 && (
              <Link href="/dashboard/monthly">
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Receipt size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-800">
                      {pendingMonthlyCount} cuota
                      {pendingMonthlyCount !== 1 ? "s" : ""} mensual
                      {pendingMonthlyCount !== 1 ? "es" : ""} sin cobrar
                    </p>
                    <p className="text-xs text-blue-600">
                      Total: ${pendingMonthlyAmount.toFixed(2)} — Ve a Cuotas
                      Mensuales
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-blue-500 shrink-0" />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* ── Main grid: activity + sidebar ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent payments */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Receipt size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Pagos Recientes
                </h2>
              </div>
              <Link
                href="/dashboard/reports"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Ver reportes
                <ArrowRight size={12} />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Receipt size={22} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">
                  No hay pagos registrados
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Los pagos aparecerán aquí cuando se registren
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentPayments.map((payment) => (
                  <Link
                    key={payment.id}
                    href={`/dashboard/payments/${payment.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        CONCEPT_COLORS[payment.concept] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <DollarSign size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {payment.memberName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {CONCEPT_LABELS[payment.concept]} ·{" "}
                        {new Date(payment.date).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800 tabular-nums">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 font-mono hidden sm:block mt-0.5">
                        {payment.receiptNumber}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick access */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center">
                    <BarChart3 size={12} className="text-violet-600" />
                  </div>
                  Accesos Rápidos
                </h2>
                <div className="space-y-2">
                  {[
                    {
                      href: "/dashboard/monthly",
                      label: "Cuotas Mensuales",
                      sub: `${pendingMonthlyCount} pendientes`,
                      color: "from-blue-500 to-indigo-600",
                      icon: Receipt,
                      badge: pendingMonthlyCount > 0,
                    },
                    {
                      href: "/dashboard/events",
                      label: "Eventos",
                      sub: `${events.length} creados`,
                      color: "from-violet-500 to-purple-600",
                      icon: CalendarDays,
                      badge: false,
                    },
                    {
                      href: "/dashboard/users",
                      label: "Usuarios",
                      sub: `${members.length} registrados`,
                      color: "from-sky-500 to-blue-600",
                      icon: Users,
                      badge: false,
                    },
                    {
                      href: "/dashboard/reports",
                      label: "Reportes",
                      sub: "Ver gráficos",
                      color: "from-emerald-500 to-green-600",
                      icon: BarChart3,
                      badge: false,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} className="group">
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-sm`}
                          >
                            <Icon size={15} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                              {item.label}
                            </p>
                            <p className="text-xs text-gray-400">{item.sub}</p>
                          </div>
                          {item.badge && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                          <ArrowRight
                            size={13}
                            className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming events */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center">
                    <Clock size={12} className="text-violet-600" />
                  </div>
                  Próximos Eventos
                </h2>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2
                      size={28}
                      className="text-gray-200 mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-400">
                      Sin eventos próximos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => {
                      const [y, m, d] = event.date.split("-").map(Number);
                      const evDate = new Date(y, m - 1, d);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.round(
                        (evDate.getTime() - today.getTime()) / 86400000,
                      );
                      return (
                        <Link
                          key={event.id}
                          href={`/dashboard/events/${event.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center shrink-0 shadow-sm">
                            <span className="text-white text-xs font-bold leading-none">
                              {String(d).padStart(2, "0")}
                            </span>
                            <span className="text-white/70 text-[9px] leading-none mt-0.5 capitalize">
                              {evDate.toLocaleDateString("es-ES", {
                                month: "short",
                              })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-gray-900">
                              {event.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {diffDays === 0
                                ? "Hoy"
                                : diffDays === 1
                                  ? "Mañana"
                                  : `En ${diffDays} días`}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* System info */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={16} className="text-white/80" />
                <span className="text-white/80 text-xs font-medium">
                  Sistema activo
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Hectáreas totales</span>
                  <span className="text-white font-semibold tabular-nums">
                    {totalHectares.toFixed(2)} ha
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Tarifa / ha</span>
                  <span className="text-white font-semibold">
                    ${ratePerHectare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/20 pt-1.5 mt-1.5">
                  <span className="text-white/60">
                    Ingreso mensual esperado
                  </span>
                  <span className="text-white font-bold tabular-nums">
                    ${expectedMonthly.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
