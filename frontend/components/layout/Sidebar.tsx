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
  Users2,
  Settings,
  Database,
  GraduationCap,
  Inbox,
  Link2,
  Bookmark,
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
  { label: "Shortlist", href: "/student/shortlist", icon: Bookmark },
  { label: "Profile", href: "/student/profile", icon: User },
];

const consultantNav: NavItem[] = [
  { label: "Dashboard", href: "/consultant/dashboard", icon: LayoutDashboard },
  { label: "Applications", href: "/consultant/applications", icon: FileText },
  { label: "Tracking", href: "/consultant/tracking", icon: Link2 },
  { label: "Agencies", href: "/consultant/agencies", icon: Users },
  { label: "Profile", href: "/consultant/profile", icon: User },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Consultants", href: "/admin/consultants", icon: Users2 },
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
    <aside className="fixed left-0 top-0 h-full w-64 sidebar-gradient z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:shadow-blue-600/50 transition-shadow">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-black tracking-tight text-white text-sm leading-none">Find Your</div>
            <div className="font-black tracking-tight text-blue-400 text-sm leading-tight">University</div>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-5 pb-2">
        <span className="tag-pill tag-pill-blue">
          {role} portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                active
                  ? "bg-blue-600/15 text-blue-300 border border-blue-500/25 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/6 border border-transparent"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-blue-400" : ""}
              />
              {item.label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/6">
        <Link
          href="/universities"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
        >
          <Building2 size={12} />
          Browse Universities
        </Link>
      </div>
    </aside>
  );
}
