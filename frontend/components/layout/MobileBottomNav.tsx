"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Upload,
  User,
  Link2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  matchPrefix?: boolean;
}

const studentTabs: NavItem[] = [
  { label: "Home", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Match", href: "/student/match", icon: Sparkles },
  { label: "Apply", href: "/student/applications", icon: FileText, matchPrefix: true },
  { label: "Docs", href: "/student/documents", icon: Upload },
  { label: "Me", href: "/student/profile", icon: User },
];

const consultantTabs: NavItem[] = [
  { label: "Dashboard", href: "/consultant/dashboard", icon: LayoutDashboard },
  { label: "Applications", href: "/consultant/applications", icon: FileText },
  { label: "Tracking", href: "/consultant/tracking", icon: Link2 },
  { label: "Me", href: "/consultant/profile", icon: User },
];

interface MobileBottomNavProps {
  role: "student" | "consultant";
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const tabs =
    role === "student" ? studentTabs : consultantTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bottom-nav-glass flex items-center safe-area-bottom">
      {tabs.map((tab) => {
        const active = tab.matchPrefix
          ? pathname.startsWith(tab.href)
          : pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
          >
            <div
              className={cn(
                "w-10 h-7 rounded-xl flex items-center justify-center transition-all",
                active
                  ? "bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]"
                  : ""
              )}
            >
              <Icon
                size={17}
                className={active ? "text-[#10B981]" : "text-[#94A3B8]"}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide leading-none",
                active ? "text-[#10B981]" : "text-[#94A3B8]"
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
