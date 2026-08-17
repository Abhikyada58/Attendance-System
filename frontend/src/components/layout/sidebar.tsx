"use client";

import Link from "next/link";
import {
  LayoutDashboard, CheckSquare, BookOpen, BarChart3, FileText,
  Settings, UserCircle, Users, Building2, Sparkles, QrCode, Camera,
  ScanFace, HelpCircle, MessageSquare, Target, LogOut, Shield, Lock, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const baseItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Profile",   icon: UserCircle,       href: "/profile"   },
    { name: "Security",  icon: Shield,           href: "/profile/security" },
    { name: "Privacy",   icon: Lock,             href: "/profile/privacy"  },
  ];

  const studentItems = [
    { name: "Attendance",      icon: CheckSquare,  href: "/attendance"         },
    { name: "Subjects",        icon: BookOpen,     href: "/subjects"           },
    { name: "Analytics",       icon: BarChart3,    href: "/analytics"          },
    { name: "Reports",         icon: FileText,     href: "/reports"            },
    { name: "AI Insights",     icon: Sparkles,     href: "/ai-insights"        },
    { name: "My Requests",     icon: FileText,     href: "/student/requests"   },
    { name: "Engagement",      icon: Target,       href: "/student/engagement" },
    { name: "Support Tickets", icon: MessageSquare,href: "/student/tickets"    },
    { name: "Help Center",     icon: HelpCircle,   href: "/help"               },
    { name: "Scan QR",         icon: QrCode,       href: "/scan"               },
    { name: "Face Scan",       icon: Camera,       href: "/face-scan"          },
    { name: "Enroll Face",     icon: ScanFace,     href: "/enroll-face"        },
  ];

  const facultyItems = [
    { name: "Attendance", icon: CheckSquare, href: "/attendance" },
    { name: "Subjects",   icon: BookOpen,    href: "/subjects"   },
    { name: "Classes",    icon: Users,       href: "/classes"    },
    { name: "Analytics",  icon: BarChart3,   href: "/analytics"  },
    { name: "Reports",    icon: FileText,    href: "/reports"    },
    { name: "AI Insights",icon: Sparkles,    href: "/ai-insights"},
  ];

  const adminItems = [
    { name: "Academic",         icon: BookOpen,    href: "/admin/academic"           },
    { name: "Institutes",       icon: Building2,   href: "/admin/academic/institutes"},
    { name: "Users",            icon: Users,       href: "/admin/users"              },
    { name: "Reports",          icon: FileText,    href: "/reports"                  },
    { name: "AI Insights",      icon: Sparkles,    href: "/ai-insights"              },
    { name: "Settings",         icon: Settings,    href: "/admin/settings"           },
    { name: "Security Monitor", icon: Shield,      href: "/admin/security"           },
    { name: "System Monitor",   icon: Activity,    href: "/admin/monitoring"         },
  ];

  const roleItems =
    user?.role === "STUDENT" ? studentItems :
    user?.role === "FACULTY" ? facultyItems :
    user?.role === "ADMIN"   ? adminItems   : [];

  const navItems = [...baseItems, ...roleItems];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className={cn(
      "hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen sticky top-0",
      className
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-base">A</span>
        </div>
        <span className="text-lg font-black text-indigo-600 tracking-tight">AttendX</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}   // ← pre-fetches page on mount so click is instant
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive(item.href)
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 flex-shrink-0",
              isActive(item.href) ? "text-indigo-600" : "text-gray-400"
            )} />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {user && (
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-bold text-xs">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
