"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, FileText, Upload, Building2, ArrowRight,
  TrendingUp, CheckCircle2, Clock, Send, Trophy,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Application, ApplicationApiResponse, MatchResultItem } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/student/match">
          <Button size="lg">
            <Sparkles size={16} className="mr-1.5" /> Show me my matches
          </Button>
        </Link>
        <Link href="/student/documents">
          <Button variant="outline">
            <Upload size={15} className="mr-1.5" /> Upload Docs
          </Button>
        </Link>
        <Link href="/universities">
          <Button variant="outline">
            <Building2 size={15} className="mr-1.5" /> Browse Unis
          </Button>
        </Link>
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
              {topMatches.map((result, i) => {
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
    </PageWrapper>
  );
}
