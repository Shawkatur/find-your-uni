"use client";

import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, Settings, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-sm sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Mobile brand mark */}
      <Link href="/" className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-[#10B981] rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
          <GraduationCap size={16} className="text-white" />
        </div>
        <span className="font-black tracking-tight text-[#333] text-sm">Find Your Uni</span>
      </Link>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
          <Bell size={18} className="text-[#64748B]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10B981] rounded-full" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F1F5F9] transition-colors outline-none">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#10B981] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#333] leading-none">
                {profile?.full_name ?? user?.email?.split("@")[0] ?? "User"}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5 capitalize">{profile?.role ?? "student"}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border-[#E2E8F0]">
            <DropdownMenuItem
              onClick={() => router.push("/student/profile")}
              className="text-[#333] hover:bg-[#F1F5F9] cursor-pointer"
            >
              <User size={14} className="mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/student/settings")}
              className="text-[#333] hover:bg-[#F1F5F9] cursor-pointer"
            >
              <Settings size={14} className="mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E2E8F0]" />
            <DropdownMenuItem
              onClick={signOut}
              className="text-red-500 hover:bg-red-50 cursor-pointer"
            >
              <LogOut size={14} className="mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
