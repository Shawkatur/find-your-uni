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
  GraduationCap,
  Link2,
  Bookmark,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Ordered to follow the "How It Works" 6-step flow:
// 1. Profile  2. Documents  3. Universities/Shortlist  4. Applications
const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/student/profile", icon: User },
  { label: "Documents", href: "/student/documents", icon: Upload },
  { label: "Universities", href: "/universities", icon: Building2 },
  { label: "Shortlist", href: "/student/shortlist", icon: Bookmark },
  { label: "Applications", href: "/student/applications", icon: FileText },
];

const consultantNav: NavItem[] = [
  { label: "Dashboard", href: "/consultant/dashboard", icon: LayoutDashboard },
  { label: "My Students", href: "/consultant/students", icon: GraduationCap },
  { label: "Applications", href: "/consultant/applications", icon: FileText },
  { label: "Documents", href: "/consultant/documents", icon: ShieldCheck },
  { label: "Tracking", href: "/consultant/tracking", icon: Link2 },
  { label: "Agencies", href: "/consultant/agencies", icon: Users },
  { label: "Profile", href: "/consultant/profile", icon: User },
];

interface SidebarProps {
  role: "student" | "consultant";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "student" ? studentNav : consultantNav;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 sidebar-gradient z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-black tracking-tight text-[#333] text-sm leading-none">Find Your</div>
            <div className="font-black tracking-tight text-[#10B981] text-sm leading-tight">Uni</div>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-5 pb-2">
        <span className="tag-pill tag-pill-green">
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
                  ? "bg-[rgba(16,185,129,0.08)] text-[#059669] border border-[rgba(16,185,129,0.2)] shadow-sm"
                  : "text-[#64748B] hover:text-[#333] hover:bg-[#F1F5F9] border border-transparent"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-[#10B981]" : ""}
              />
              {item.label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <Link
          href="/universities"
          className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#333] transition-colors font-medium"
        >
          <Building2 size={12} />
          Browse Unis
        </Link>
      </div>
    </aside>
  );
}
