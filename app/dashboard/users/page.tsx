'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import type { Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberDialog } from '@/components/member-dialog';
import { Plus, Pencil, Trash2, UserX, Search } from 'lucide-react';
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

export default function UsersPage() {
  const { members, deleteMember, currentUser, isHydrated } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-3">
        <UserX size={40} className="text-muted-foreground" />
        <p className="text-muted-foreground font-medium">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.cedula.includes(search) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (member: Member) => {
    setEditMember(member);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditMember(null);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMember(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los miembros del sistema.
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2 shrink-0">
          <Plus size={16} aria-hidden="true" />
          Agregar Usuario
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre, cédula o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cédula
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Correo
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Teléfono
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Registro
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  {search
                    ? 'No se encontraron usuarios.'
                    : 'No hay usuarios. Agrega el primero.'}
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-muted-foreground">
                    {member.cedula}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {member.name}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                    {member.email}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                    {member.phone}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                    {new Date(member.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(member)}
                        aria-label={`Editar ${member.name}`}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(member.id)}
                        aria-label={`Eliminar ${member.name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editMember}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              este usuario del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
