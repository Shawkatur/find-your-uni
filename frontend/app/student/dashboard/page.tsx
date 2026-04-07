"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, FileText, Upload, ArrowRight,
  TrendingUp, CheckCircle2, Clock, Send, Trophy,
  User, Plane, Stamp,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Application, ApplicationApiResponse, MatchResultItem } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StudentDashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const { data: applications = [], isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["student-applications"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=20");
      return (res.data || []).map((app: ApplicationApiResponse): Application => ({
        ...app,
        student: app.students ?? app.student,
        program: app.programs ?? app.program,
        university: app.programs?.universities ?? app.university,
      }));
    },
  });

  const { data: matchResults = [] } = useQuery<MatchResultItem[]>({
    queryKey: ["match-results-preview"],
    queryFn: async () => {
      try {
        const res = await api.get("/match/results");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
  });

  const statusCounts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  const topMatches = matchResults.slice(0, 3);
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const offerCount = (statusCounts["offer_received"] ?? 0) + (statusCounts["conditional_offer"] ?? 0);
  const activeCount =
    (statusCounts["lead"] ?? 0) + (statusCounts["pre_evaluation"] ?? 0) +
    (statusCounts["docs_collection"] ?? 0) + (statusCounts["applied"] ?? 0);
  const topMatchPct = matchResults[0] ? Math.round(matchResults[0].score * 100) : null;

  return (
    <PageWrapper>
      {/* Welcome Hero */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-widest mb-1">
              Student Portal
            </p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              <span className="text-[#333]">Hey {firstName},</span>
              <br />
              <span className="text-[#10B981]">
                let&apos;s find your uni
              </span>
            </h1>
            <p className="text-[#64748B] mt-2 font-normal text-sm">
              Your journey to the right uni starts here.
            </p>
          </div>
          {topMatchPct && (
            <div className="hidden lg:flex flex-col items-center px-5 py-4 rounded-2xl bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)]">
              <span className="text-4xl font-black text-[#10B981]">{topMatchPct}%</span>
              <span className="text-xs text-[#64748B] font-semibold mt-1">Top Match</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <Send size={13} className="text-[#10B981]" />
            </div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wide">Applied</span>
          </div>
          <div className="text-3xl font-black text-[#333] tracking-tight">{applications.length}</div>
          <div className="text-[#64748B] text-xs mt-0.5">unis total</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] flex items-center justify-center">
              <Clock size={13} className="text-[#3B82F6]" />
            </div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wide">In Review</span>
          </div>
          <div className="text-3xl font-black text-[#333] tracking-tight">{activeCount}</div>
          <div className="text-[#64748B] text-xs mt-0.5">active apps</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <Trophy size={13} className="text-[#10B981]" />
            </div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wide">Offers</span>
          </div>
          <div className={`text-3xl font-black tracking-tight ${offerCount > 0 ? "text-[#10B981]" : "text-[#333]"}`}>
            {offerCount}
          </div>
          <div className="text-[#64748B] text-xs mt-0.5">offer letters</div>
        </div>
      </div>

      {/* Quick Actions — mirrors the 6-step "How It Works" flow */}
      <div className="mb-8">
        <p className="text-[#64748B] text-xs font-bold uppercase tracking-widest mb-3">Jump to a step</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { n: 1, label: "Profile", href: "/student/profile", icon: User },
            { n: 2, label: "Documents", href: "/student/documents", icon: Upload },
            { n: 3, label: "Match", href: "/student/match", icon: Sparkles },
            { n: 4, label: "Applications", href: "/student/applications", icon: Send },
            { n: 5, label: "Visa", href: "/student/applications", icon: Stamp },
            { n: 6, label: "Fly", href: "/student/applications", icon: Plane },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.n}
                href={s.href}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#10B981]/40 hover:bg-[rgba(16,185,129,0.04)] transition-all"
              >
                <span className="w-6 h-6 rounded-md bg-[#F1F5F9] group-hover:bg-[#10B981]/10 flex items-center justify-center text-[10px] font-black text-[#64748B] group-hover:text-[#10B981] transition-colors shrink-0">
                  {s.n}
                </span>
                <Icon size={14} className="text-[#10B981] shrink-0" />
                <span className="text-[#333] font-bold text-xs truncate">{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Application Status */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <FileText size={15} className="text-[#10B981]" />
            </div>
            <h2 className="text-[#333] font-black tracking-tight">Applications</h2>
          </div>
          {appsLoading ? (
            <LoadingSpinner size="sm" />
          ) : applications.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={FileText}
                title="Nothing here yet"
                description="Find your top unis and start applying."
                action={{ label: "Find Matches", onClick: () => router.push("/student/match") }}
                className="py-8"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <StatusBadge status={status} />
                  <span className="text-[#333] font-black text-sm">{count}</span>
                </div>
              ))}
              <Link
                href="/student/applications"
                className="flex items-center gap-1 text-[#10B981] hover:text-[#059669] text-xs font-bold pt-2 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </GlassCard>

        {/* Top Match Results */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] flex items-center justify-center">
                <TrendingUp size={15} className="text-[#F59E0B]" />
              </div>
              <h2 className="text-[#333] font-black tracking-tight">Top Matches</h2>
            </div>
            <Link
              href="/student/match"
              className="text-[#10B981] text-xs hover:text-[#059669] font-bold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {topMatches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="Run matching to see your top unis ranked by fit."
              action={{ label: "Show me my matches", onClick: () => router.push("/student/match") }}
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {topMatches.map((result) => {
                const pct = Math.round(result.score * 100);
                const isHigh = pct >= 80;
                return (
                  <div
                    key={`${result.university_id}-${result.program_id}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#10B981]/25 hover:bg-[rgba(16,185,129,0.03)] transition-all duration-200"
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`relative w-13 h-13 rounded-xl border flex flex-col items-center justify-center z-10 ${
                          isHigh
                            ? "bg-[#ECFDF5] border-[rgba(16,185,129,0.3)]"
                            : "bg-[#EFF6FF] border-[rgba(59,130,246,0.3)]"
                        }`}
                        style={{ width: 52, height: 52 }}
                      >
                        <span
                          className={`font-black text-base tracking-tight leading-none ${
                            isHigh ? "text-[#059669]" : "text-[#2563EB]"
                          }`}
                        >
                          {pct}%
                        </span>
                        <span className="text-[8px] text-[#64748B] uppercase tracking-widest font-bold">fit</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#333] font-black tracking-tight text-sm truncate">
                        {result.university_name}
                      </div>
                      <div className="text-[#64748B] text-xs font-medium mt-0.5">
                        {result.program_name} · {result.country}
                      </div>
                    </div>
                    {/* Mini bar */}
                    <div className="w-16 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          isHigh
                            ? "bg-gradient-to-r from-[#10B981] to-[#34D399]"
                            : "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <GlassCard className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
                <CheckCircle2 size={15} className="text-[#64748B]" />
              </div>
              <h2 className="text-[#333] font-black tracking-tight">Recent Activity</h2>
            </div>
            <Link
              href="/student/applications"
              className="text-[#10B981] text-xs hover:text-[#059669] font-bold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {applications.slice(0, 5).map((app) => (
              <Link key={app.id} href={`/student/applications/${app.id}`}>
                <div className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group">
                  <div>
                    <div className="text-[#333] text-sm font-bold group-hover:text-[#10B981] transition-colors">
                      {app.university?.name ?? "University"}
                    </div>
                    <div className="text-[#64748B] text-xs font-medium">{app.program?.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <ArrowRight size={13} className="text-[#94A3B8] group-hover:text-[#10B981] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      )}

      {/* How It Works */}
      <div className="mt-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#333]">How It Works</h2>
          <p className="text-[#64748B] text-sm mt-1">Follow these simple steps to study abroad through Find Your Uni.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              n: 1,
              title: "Create Your Profile",
              desc: "Fill out your academic background, preferred countries, and contact info so we can match you better.",
              href: "/student/profile",
              icon: User,
            },
            {
              n: 2,
              title: "Upload Documents",
              desc: "Easily upload required documents like transcripts, passports, and English test scores.",
              href: "/student/documents",
              icon: Upload,
            },
            {
              n: 3,
              title: "Get Matched",
              desc: "Our AI reviews your profile and ranks the best-fit universities based on your goals.",
              href: "/student/match",
              icon: Sparkles,
            },
            {
              n: 4,
              title: "Apply to Universities",
              desc: "Apply to your shortlisted universities and track every application status from one place.",
              href: "/student/applications",
              icon: Send,
            },
            {
              n: 5,
              title: "Prepare for Visa",
              desc: "Once you get an offer, you'll be guided step-by-step through your visa application.",
              href: "/student/applications",
              icon: Stamp,
            },
            {
              n: 6,
              title: "Fly to Your Dream University",
              desc: "Book your flight, attend a pre-departure session, and begin your international journey.",
              href: "/student/applications",
              icon: Plane,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.n}
                href={step.href}
                className="group relative flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#10B981]/40 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]" />
                <div className="text-5xl font-black text-[#E2E8F0] leading-none shrink-0 select-none w-10 text-center">
                  {step.n}
                </div>
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} className="text-[#10B981]" />
                    <h3 className="text-[#333] font-black text-sm tracking-tight group-hover:text-[#10B981] transition-colors">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[#64748B] text-xs leading-relaxed">{step.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
