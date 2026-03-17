"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Droplets,
} from "lucide-react";

const features = [
  "Gestión de cuotas mensuales",
  "Control de eventos y multas",
  "Reportes financieros en tiempo real",
];

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const success = login(username, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL (decorative) ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden p-12"
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
        }}
      >
        {/* Decorative circles */}
        <span className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <span className="absolute top-10 right-0 w-64 h-64 rounded-full bg-white/10" />
        <span className="absolute bottom-0 -left-12 w-72 h-72 rounded-full bg-white/5" />
        <span className="absolute -bottom-20 right-10 w-96 h-96 rounded-full bg-white/5" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-lg h-128 rounded-full bg-white/3" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Droplets className="w-10 h-10 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              PayManager
            </h1>
            <p className="text-lg text-white/70 font-medium">
              Sistema de Gestión de Pagos
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-0.5 rounded-full bg-white/30" />

          {/* Features */}
          <ul className="flex flex-col gap-4 text-left w-full">
            {features.map((feat) => (
              <li key={feat} className="flex items-center gap-3">
                <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </span>
                <span className="text-white/90 text-sm font-medium">
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ──────────────────────────────────── */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-violet-600 shadow-md mb-1">
              <Droplets className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-gray-500">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Usuario
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    className="pl-9 h-11 border-gray-200 focus-visible:ring-violet-500 focus-visible:border-violet-400 rounded-xl bg-gray-50/60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-9 h-11 border-gray-200 focus-visible:ring-violet-500 focus-visible:border-violet-400 rounded-xl bg-gray-50/60"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
                  bg-linear-to-r from-blue-600 to-violet-600
                  hover:from-blue-700 hover:to-violet-700
                  active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-md shadow-violet-200"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Ingresando…
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 space-y-2">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              Credenciales de prueba
            </p>
            <div className="flex flex-col gap-1 text-xs text-blue-700">
              <p>
                Admin:{" "}
                <code className="font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-md">
                  admin
                </code>
                {" / "}
                <code className="font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-md">
                  admin123
                </code>
              </p>
              <p>
                Usuario:{" "}
                <code className="font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-md">
                  user1
                </code>
                {" / "}
                <code className="font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-md">
                  user123
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
