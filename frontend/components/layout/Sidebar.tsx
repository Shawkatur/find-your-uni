"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  FileText,
  Upload,
  User,
  Users,
  Settings,
  Database,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Match", href: "/student/match", icon: Sparkles },
  { label: "Universities", href: "/universities", icon: Building2 },
  { label: "Applications", href: "/student/applications", icon: FileText },
  { label: "Documents", href: "/student/documents", icon: Upload },
  { label: "Profile", href: "/student/profile", icon: User },
];

const consultantNav: NavItem[] = [
  { label: "Dashboard", href: "/consultant/dashboard", icon: LayoutDashboard },
  { label: "Applications", href: "/consultant/applications", icon: FileText },
  { label: "Agencies", href: "/consultant/agencies", icon: Users },
  { label: "Profile", href: "/consultant/profile", icon: User },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Universities", href: "/admin/universities", icon: Building2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Import", href: "/admin/import", icon: Database },
];

interface SidebarProps {
  role: "student" | "consultant" | "admin";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "student" ? studentNav : role === "consultant" ? consultantNav : adminNav;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 sidebar-gradient z-40 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm leading-tight">
            Find Your<br />University
          </span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
          {role} portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/6"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/8">
        <Link
          href="/universities"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Building2 size={12} />
          Browse Universities
        </Link>
      </div>
    </aside>
  );
}
