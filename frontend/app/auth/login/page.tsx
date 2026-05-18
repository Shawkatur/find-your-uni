"use client";

import Link from "next/link";
import { GraduationCap, Briefcase, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function LoginPickerPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="relative w-16 h-16 bg-[#10B981] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <GraduationCap size={30} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t("auth.welcomeBack")}</h1>
          <p className="text-muted-foreground mt-1">How would you like to sign in?</p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Student */}
          <Link href="/auth/login/student" className="group glass-card p-6 flex flex-col gap-4 hover:border-[#10B981]/40 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-xl flex items-center justify-center group-hover:bg-[rgba(16,185,129,0.12)] transition-colors">
              <GraduationCap size={24} className="text-[#10B981]" />
            </div>
            <div className="flex-1">
              <h2 className="text-foreground font-bold text-lg">Student</h2>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                See your matches, track apps, and manage docs.
              </p>
            </div>
            <div className="flex items-center text-[#10B981] text-sm font-semibold group-hover:gap-2 transition-all gap-1">
              {t("auth.signInStudent")} <ChevronRight size={16} />
            </div>
          </Link>

          {/* Consultant */}
          <Link href="/auth/login/consultant" className="group glass-card p-6 flex flex-col gap-4 hover:border-[#3B82F6]/40 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] rounded-xl flex items-center justify-center group-hover:bg-[rgba(59,130,246,0.12)] transition-colors">
              <Briefcase size={24} className="text-[#3B82F6]" />
            </div>
            <div className="flex-1">
              <h2 className="text-foreground font-bold text-lg">Consultant</h2>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                Manage your agency, students, and pipeline.
              </p>
            </div>
            <div className="flex items-center text-[#3B82F6] text-sm font-semibold group-hover:gap-2 transition-all gap-1">
              {t("auth.signInConsultant")} <ChevronRight size={16} />
            </div>
          </Link>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-8">
          <Link href="/" className="hover:text-muted-foreground transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
