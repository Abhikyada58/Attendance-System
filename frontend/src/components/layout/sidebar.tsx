"use client";

import Link from "next/link";
import { LayoutDashboard, CheckSquare, BookOpen, BarChart3, FileText, Bell, Settings, UserCircle, Users, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export function Sidebar({ className }: { className?: string }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Base items everyone sees
  let navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Profile", icon: UserCircle, href: "/profile" },
  ];

  if (user?.role === "STUDENT") {
    navItems.push(
      { name: "Attendance", icon: CheckSquare, href: "/attendance" },
      { name: "Subjects", icon: BookOpen, href: "/subjects" },
      { name: "Analytics", icon: BarChart3, href: "/analytics" },
      { name: "Reports", icon: FileText, href: "/reports" },
      { name: "AI Insights", icon: Sparkles, href: "/ai-insights" },
      { name: "My Requests", icon: FileText, href: "/student/requests" },
      { name: "Engagement", icon: Sparkles, href: "/student/engagement" },
      { name: "Support Tickets", icon: FileText, href: "/student/tickets" },
      { name: "Help Center", icon: BookOpen, href: "/help" },
      { name: "Scan QR", icon: CheckSquare, href: "/scan" },
      { name: "Face Scan", icon: CheckSquare, href: "/face-scan" },
      { name: "Enroll Face", icon: CheckSquare, href: "/enroll-face" }
    );
  } else if (user?.role === "FACULTY") {
    navItems.push(
      { name: "Attendance", icon: CheckSquare, href: "/attendance" },
      { name: "Subjects", icon: BookOpen, href: "/subjects" },
      { name: "Classes", icon: Users, href: "/classes" },
      { name: "Analytics", icon: BarChart3, href: "/analytics" },
      { name: "Reports", icon: FileText, href: "/reports" },
      { name: "AI Insights", icon: Sparkles, href: "/ai-insights" }
    );
  } else if (user?.role === "ADMIN") {
    navItems.push(
      { name: "Academic", icon: BookOpen, href: "/admin/academic" },
      { name: "Institutes", icon: Building2, href: "/admin/academic/institutes" },
      { name: "Users", icon: Users, href: "/admin/users" },
      { name: "Reports", icon: FileText, href: "/reports" },
      { name: "AI Insights", icon: Sparkles, href: "/ai-insights" },
      { name: "Settings", icon: Settings, href: "/admin/settings" }
    );
  }

  return (
    <aside className={cn("hidden md:flex flex-col w-64 glass-panel border-r min-h-screen p-4 sticky top-0", className)}>
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center neo-shadow-sm neo-border">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-primary">AttendX</h1>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
              pathname === item.href 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      
      {user && (
        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="glass-panel p-3 rounded-md">
            <p className="text-xs font-semibold text-primary mb-1">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
