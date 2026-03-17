'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  BarChart3,
  LogOut,
  Receipt,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, adminOnly: true },
  { href: '/dashboard/monthly', label: 'Cuotas Mensuales', icon: Receipt, adminOnly: true },
  { href: '/dashboard/events', label: 'Eventos', icon: CalendarDays, adminOnly: true },
  { href: '/dashboard/payments', label: 'Pagos', icon: CreditCard },
  { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3, adminOnly: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logout } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || currentUser?.role === 'admin'
  );

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm select-none shrink-0">
            P
          </div>
          <span className="text-sidebar-foreground font-semibold text-sm">
            PayManager
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        <div className="px-3 py-2">
          <p className="text-sidebar-foreground text-sm font-medium truncate">
            {currentUser?.name}
          </p>
          <p className="text-sidebar-foreground/50 text-xs capitalize">
            {currentUser?.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut size={17} aria-hidden="true" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
