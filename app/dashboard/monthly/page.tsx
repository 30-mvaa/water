'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { CalendarPlus, Search, DollarSign, Users, AlertCircle } from 'lucide-react';

export default function MonthlyChargesPage() {
  const { members, monthlyCharges, generateMonthlyCharges, ratePerHectare, isHydrated } = useApp();
  const [search, setSearch] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  // Get unique months from charges
  const months = [...new Set(monthlyCharges.map((c) => c.month))].sort().reverse();

  // Filter charges by search (member name)
  const filteredCharges = monthlyCharges.filter((charge) => {
    const member = members.find((m) => m.id === charge.memberId);
    return member?.name.toLowerCase().includes(search.toLowerCase());
  });

  // Group charges by month
  const chargesByMonth = months.reduce((acc, month) => {
    acc[month] = filteredCharges.filter((c) => c.month === month);
    return acc;
  }, {} as Record<string, typeof monthlyCharges>);

  // Stats
  const totalPending = monthlyCharges.filter((c) => !c.paid).reduce((sum, c) => sum + c.amount, 0);
  const totalCollected = monthlyCharges.filter((c) => c.paid).reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = monthlyCharges.filter((c) => !c.paid).length;

  const handleGenerate = () => {
    generateMonthlyCharges(selectedMonth);
    setGenerateDialogOpen(false);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cuotas Mensuales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Genera y gestiona los cobros mensuales basados en hectáreas (${ratePerHectare}/ha).
          </p>
        </div>
        <Button onClick={() => setGenerateDialogOpen(true)} className="shrink-0">
          <CalendarPlus size={16} className="mr-2" />
          Generar Cuotas
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign size={14} />
              Total Recaudado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${totalCollected.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle size={14} />
              Deuda Pendiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users size={14} />
              Cuotas Pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {months.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay cuotas generadas. Haz clic en {"\"Generar Cuotas\""} para crear los cobros del mes.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {months.map((month) => {
            const monthCharges = chargesByMonth[month] || [];
            if (monthCharges.length === 0 && search) return null;
            const paidCount = monthCharges.filter((c) => c.paid).length;
            const pendingCountMonth = monthCharges.filter((c) => !c.paid).length;

            return (
              <Card key={month}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {formatMonth(month)}
                    </CardTitle>
                    <div className="flex gap-2 text-sm">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {paidCount} pagados
                      </Badge>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {pendingCountMonth} pendientes
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Usuario</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead className="text-right">Hectáreas</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthCharges.map((charge) => {
                        const member = members.find((m) => m.id === charge.memberId);
                        return (
                          <TableRow key={charge.id}>
                            <TableCell className="font-medium">
                              {member?.name || 'Desconocido'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member?.cedula || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {member?.land.hectares.toFixed(2) || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${charge.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              {charge.paid ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  Pagado
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                  Pendiente
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Cuotas Mensuales</DialogTitle>
            <DialogDescription>
              Se crearán cuotas para todos los usuarios activos basadas en sus hectáreas.
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
            <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
              <p><strong>Usuarios activos:</strong> {members.length}</p>
              <p><strong>Total hectáreas:</strong> {members.reduce((sum, m) => sum + m.land.hectares, 0).toFixed(2)}</p>
              <p><strong>Total a generar:</strong> ${(members.reduce((sum, m) => sum + m.land.hectares, 0) * ratePerHectare).toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate}>Generar Cuotas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
