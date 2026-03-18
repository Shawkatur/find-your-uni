"use client";

import Link from "next/link";
import { GraduationCap, Briefcase, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPickerPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="glow-blue" />
            <div className="relative w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
              <GraduationCap size={30} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
          <p className="text-slate-400 mt-1">Choose how you&apos;d like to sign in</p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Student */}
          <Link href="/auth/login/student" className="group glass-card p-6 flex flex-col gap-4 hover:border-blue-500/50 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/25 rounded-xl flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
              <GraduationCap size={24} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">Student</h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Access your university matches, applications, and documents.
              </p>
            </div>
            <div className="flex items-center text-blue-400 text-sm font-semibold group-hover:gap-2 transition-all gap-1">
              Sign in as Student <ChevronRight size={16} />
            </div>
          </Link>

          {/* Consultant */}
          <Link href="/auth/login/consultant" className="group glass-card p-6 flex flex-col gap-4 hover:border-indigo-500/50 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/25 rounded-xl flex items-center justify-center group-hover:bg-indigo-600/25 transition-colors">
              <Briefcase size={24} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">Consultant</h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Manage your agency, student pipeline, and application tracking.
              </p>
            </div>
            <div className="flex items-center text-indigo-400 text-sm font-semibold group-hover:gap-2 transition-all gap-1">
              Sign in as Consultant <ChevronRight size={16} />
            </div>
          </Link>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          <Link href="/" className="hover:text-slate-300 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
