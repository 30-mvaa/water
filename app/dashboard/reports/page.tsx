'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, DollarSign, Users, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const { getAllDebtSummaries, payments, isHydrated, ratePerHectare } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const summaries = getAllDebtSummaries();

  const totals = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = summaries.reduce((sum, s) => sum + s.totalDebt, 0);
    const totalMonthlyDebt = summaries.reduce((sum, s) => sum + s.monthlyDebt, 0);
    const totalFineDebt = summaries.reduce((sum, s) => sum + s.fineDebt, 0);
    const usersWithDebt = summaries.filter((s) => !s.isUpToDate).length;
    const usersUpToDate = summaries.filter((s) => s.isUpToDate).length;
    const totalHectares = summaries.reduce((sum, s) => sum + s.hectares, 0);
    return { totalCollected, totalDebt, totalMonthlyDebt, totalFineDebt, usersWithDebt, usersUpToDate, totalHectares };
  }, [summaries, payments]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const filtered = summaries
    .filter((s) => {
      if (filter === 'paid') return s.isUpToDate;
      if (filter === 'pending') return !s.isUpToDate;
      return true;
    })
    .filter(
      (s) =>
        s.memberName.toLowerCase().includes(search.toLowerCase()) ||
        s.cedula.includes(search)
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estado consolidado de pagos y deudas de todos los usuarios.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recaudado
            </CardTitle>
            <DollarSign size={18} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totals.totalCollected.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Total
            </CardTitle>
            <AlertTriangle size={18} className="text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              ${totals.totalDebt.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cuotas: ${totals.totalMonthlyDebt.toFixed(2)} | Multas: ${totals.totalFineDebt.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios con Deuda
            </CardTitle>
            <Users size={18} className="text-destructive" />
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
            <CheckCircle size={18} className="text-green-600" />
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

      {/* Additional Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp size={16} />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Total Hectáreas Registradas</p>
            <p className="font-semibold text-lg">{totals.totalHectares.toFixed(2)} ha</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tarifa por Hectárea</p>
            <p className="font-semibold text-lg">${ratePerHectare.toFixed(2)}/ha</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ingreso Mensual Esperado</p>
            <p className="font-semibold text-lg">${(totals.totalHectares * ratePerHectare).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
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
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Con deuda</SelectItem>
            <SelectItem value="paid">Al día</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Usuario</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead className="text-right">Hectáreas</TableHead>
              <TableHead className="text-right">Cuota/Mes</TableHead>
              <TableHead className="text-right">Total Pagado</TableHead>
              <TableHead className="text-right">Deuda Cuotas</TableHead>
              <TableHead className="text-right">Deuda Multas</TableHead>
              <TableHead className="text-center">Meses Pendientes</TableHead>
              <TableHead className="text-right">Deuda Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-10 text-muted-foreground"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((summary) => (
                <TableRow key={summary.memberId}>
                  <TableCell className="font-medium">{summary.memberName}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {summary.cedula}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.hectares.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${summary.monthlyRate.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    ${summary.totalPaid.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    ${summary.monthlyDebt.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    ${summary.fineDebt.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {summary.unpaidMonths > 0 ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {summary.unpaidMonths}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {summary.totalDebt > 0 ? (
                      <span className="text-destructive">${summary.totalDebt.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {summary.isUpToDate ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-700"
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
    </div>
  );
}
