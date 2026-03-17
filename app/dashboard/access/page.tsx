"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import type { AuthUser, Role } from "@/lib/types";
import { SUPERADMIN_ID } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Eye,
  EyeOff,
  UserCog,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

interface FormState {
  username: string;
  password: string;
  name: string;
  role: Role;
}

const EMPTY_FORM: FormState = {
  username: "",
  password: "",
  name: "",
  role: "admin",
};

export default function AccessPage() {
  const {
    authUsers,
    currentUser,
    isSuperAdmin,
    addAuthUser,
    updateAuthUser,
    toggleAuthUser,
    deleteAuthUser,
    isUsernameUnique,
    isHydrated,
  } = useApp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">
          Cargando...
        </div>
      </div>
    );
  }

  // Only superadmin can access this page
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <ShieldAlert size={32} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Acceso restringido
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Solo el administrador principal puede gestionar los accesos al
            sistema.
          </p>
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (user: AuthUser) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    });
    setErrors({});
    setShowPassword(false);
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio.";
    if (!form.username.trim()) e.username = "El usuario es obligatorio.";
    else if (!isUsernameUnique(form.username, editingUser?.id ?? undefined))
      e.username = "Este nombre de usuario ya existe.";
    if (!editingUser && !form.password.trim())
      e.password = "La contraseña es obligatoria.";
    else if (form.password && form.password.length < 4)
      e.password = "Mínimo 4 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: Omit<AuthUser, "id"> = {
      username: form.username.trim(),
      password: form.password || (editingUser?.password ?? ""),
      name: form.name.trim(),
      role: form.role,
      enabled: editingUser?.enabled ?? true,
    };

    let error: string | null = null;
    if (editingUser) {
      error = updateAuthUser(editingUser.id, data);
    } else {
      error = addAuthUser(data);
    }

    if (error) {
      setErrors({ username: error });
      return;
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAuthUser(deleteId);
      setDeleteId(null);
    }
  };

  const getRoleBadge = (user: AuthUser) => {
    if (user.id === SUPERADMIN_ID) {
      return (
        <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 gap-1">
          <ShieldCheck size={11} />
          Super Admin
        </Badge>
      );
    }
    if (user.role === "admin") {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
          <ShieldCheck size={11} />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <UserCog size={11} />
        Usuario
      </Badge>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              }}
            >
              <KeyRound size={15} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Gestión de Accesos
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Administra las cuentas de acceso al sistema. Solo tú puedes ver esta
            sección.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="shrink-0 gap-2"
          style={{
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            border: "none",
          }}
        >
          <Plus size={16} />
          Nueva Cuenta
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <ShieldAlert size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-800">Sección exclusiva</p>
          <p className="text-blue-600 mt-0.5">
            Las cuentas deshabilitadas no podrán iniciar sesión. La cuenta
            <span className="font-mono font-semibold mx-1">admin</span>
            (Super Admin) no puede ser eliminada ni deshabilitada.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Usuario
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rol
              </th>

              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {authUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  No hay cuentas registradas.
                </td>
              </tr>
            ) : (
              authUsers.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isSuperAdminAccount = user.id === SUPERADMIN_ID;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isSelf ? "bg-blue-50/40" : "hover:bg-gray-50/60"
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{
                            background:
                              user.id === SUPERADMIN_ID
                                ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                                : user.role === "admin"
                                  ? "linear-gradient(135deg, #0ea5e9, #2563eb)"
                                  : "linear-gradient(135deg, #6b7280, #374151)",
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.name}
                          </p>
                          {isSelf && (
                            <p className="text-[10px] text-blue-500 font-medium">
                              (tú)
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-5 py-4 font-mono text-gray-500 hidden sm:table-cell">
                      {user.username}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">{getRoleBadge(user)}</td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      {user.enabled ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                          <ShieldCheck size={11} />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-600 border-red-200 gap-1">
                          <ShieldOff size={11} />
                          Deshabilitado
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle enable/disable — not for superadmin */}
                        {!isSuperAdminAccount && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              user.enabled
                                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                : "text-green-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            onClick={() => toggleAuthUser(user.id)}
                            title={
                              user.enabled
                                ? "Deshabilitar cuenta"
                                : "Habilitar cuenta"
                            }
                          >
                            {user.enabled ? (
                              <ToggleRight size={16} />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </Button>
                        )}

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openEdit(user)}
                          title="Editar cuenta"
                        >
                          <Pencil size={14} />
                        </Button>

                        {/* Delete — not for superadmin or self */}
                        {!isSuperAdminAccount && !isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(user.id)}
                            title="Eliminar cuenta"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound size={17} className="text-primary" />
              {editingUser ? "Editar Cuenta" : "Nueva Cuenta de Acceso"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos de la cuenta. Deja la contraseña en blanco para no cambiarla."
                : "Crea una nueva cuenta para acceder al sistema."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Nombre completo *</Label>
              <Input
                id="acc-name"
                placeholder="Ej: Juan Pérez"
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  setErrors((p) => ({ ...p, name: undefined }));
                }}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-username">Nombre de usuario *</Label>
              <Input
                id="acc-username"
                placeholder="Ej: juan123"
                value={form.username}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    username: e.target.value.toLowerCase().replace(/\s/g, ""),
                  }));
                  setErrors((p) => ({ ...p, username: undefined }));
                }}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-password">
                Contraseña{" "}
                {editingUser ? "(dejar en blanco para no cambiar)" : "*"}
              </Label>
              <div className="relative">
                <Input
                  id="acc-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingUser ? "••••••••" : "Mínimo 4 caracteres"}
                  value={form.password}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, password: e.target.value }));
                    setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-role">Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, role: v as Role }))
                }
              >
                <SelectTrigger id="acc-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-600" />
                      Administrador — acceso completo
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserCog size={14} className="text-gray-500" />
                      Usuario — acceso limitado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  border: "none",
                }}
              >
                {editingUser ? "Guardar cambios" : "Crear cuenta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta de acceso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta. El usuario ya no
              podrá iniciar sesión. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
