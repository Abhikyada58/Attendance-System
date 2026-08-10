'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  ClipboardList,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const routes = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/academic', label: 'Academic Structure', icon: GraduationCap },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
    { href: '/admin/ai-insights', label: 'AI Insights', icon: Sparkles },
    { href: '/admin/support', label: 'Support Console', icon: LifeBuoy },
    { href: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r glass-panel shadow-sm z-40">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <span>AttendX Admin</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {routes.map((route) => {
          const isActive = pathname.startsWith(route.href);
          return (
            <Link key={route.href} href={route.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 px-3 neo-border transition-all",
                  isActive ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <route.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                <span className="font-medium">{route.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10 hover:text-red-600 neo-border"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}
