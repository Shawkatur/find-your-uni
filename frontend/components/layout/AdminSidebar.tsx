"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import adminApi from "@/lib/admin-api";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  GraduationCap,
  Building2,
  FileText,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function AdminSidebar() {
  const pathname = usePathname();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await adminApi.get("/admin/stats");
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const pendingCount = stats?.pending_consultant_approvals ?? 0;

  const adminNav: NavItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck, badge: pendingCount },
    { label: "Consultants", href: "/admin/consultants", icon: Users },
    { label: "Students", href: "/admin/students", icon: GraduationCap },
    { label: "Universities", href: "/admin/universities", icon: Building2 },
    { label: "Applications", href: "/admin/applications", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-700/50">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-black tracking-tight text-white text-sm leading-none">Find Your Uni</div>
            <div className="font-bold tracking-tight text-indigo-400 text-xs leading-tight">Super Admin</div>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-5 pb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <ShieldCheck size={12} />
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {adminNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                active
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
              )}
            >
              <Icon size={16} className={active ? "text-indigo-400" : ""} />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
              {active && !item.badge && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 font-medium">
          Find Your Uni Admin Panel
        </p>
      </div>
    </aside>
  );
}
