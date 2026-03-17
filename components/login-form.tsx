'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const success = login(username, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl select-none">
            P
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground text-balance">
              PayManager
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Inicia sesión para continuar
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials hint */}
        <div className="text-xs text-muted-foreground text-center space-y-1.5 border border-border rounded-lg p-3 bg-muted/40">
          <p className="font-medium text-foreground">Credenciales de prueba</p>
          <p>
            Admin:{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">
              admin
            </code>{' '}
            /{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">
              admin123
            </code>
          </p>
          <p>
            Usuario:{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">
              user1
            </code>{' '}
            /{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">
              user123
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
