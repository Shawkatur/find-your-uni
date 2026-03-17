"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Sparkles, FileText, Upload, Building2, ArrowRight,
  TrendingUp, CheckCircle2, Clock, Send, Trophy,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Application, MatchResultItem } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StudentDashboard() {
  const { profile } = useAuth();

  const { data: applications = [], isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["student-applications"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=20");
      return res.data?.items ?? [];
    },
  });

  const { data: matchResults = [] } = useQuery<MatchResultItem[]>({
    queryKey: ["match-results-preview"],
    queryFn: async () => {
      const res = await api.get("/match/results");
      return res.data?.results ?? [];
    },
  });

  const statusCounts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  const topMatches = matchResults.slice(0, 3);
  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  const offerCount = statusCounts["offer_received"] ?? 0;
  const activeCount =
    (statusCounts["submitted"] ?? 0) + (statusCounts["under_review"] ?? 0);
  const topMatchPct = matchResults[0] ? Math.round(matchResults[0].score.total) : null;

  return (
    <PageWrapper>
      {/* Welcome Hero */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-1">
              Student Portal
            </p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              <span className="text-white">Welcome back,</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="text-slate-500 mt-2 font-normal text-sm">
              Your path to the world&apos;s best universities starts here.
            </p>
          </div>
          {topMatchPct && (
            <div className="hidden lg:flex flex-col items-center px-5 py-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
              <div className="relative">
                <div className="match-radial-glow" />
                <span className="relative z-10 text-4xl font-black text-indigo-400">{topMatchPct}%</span>
              </div>
              <span className="text-xs text-slate-500 font-semibold mt-1">Top Match</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
              <Send size={13} className="text-indigo-400" />
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Applied</span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{applications.length}</div>
          <div className="text-slate-500 text-xs mt-0.5">universities</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
              <Clock size={13} className="text-blue-400" />
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">In Review</span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{activeCount}</div>
          <div className="text-slate-500 text-xs mt-0.5">active applications</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center">
              <Trophy size={13} className="text-emerald-400" />
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Offers</span>
          </div>
          <div className={`text-3xl font-black tracking-tight ${offerCount > 0 ? "text-emerald-400" : "text-white"}`}>
            {offerCount}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">offer letters</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/student/match">
          <Button size="lg">
            <Sparkles size={16} className="mr-1.5" /> Find My Matches
          </Button>
        </Link>
        <Link href="/student/documents">
          <Button variant="outline">
            <Upload size={15} className="mr-1.5" /> Upload Documents
          </Button>
        </Link>
        <Link href="/universities">
          <Button variant="outline">
            <Building2 size={15} className="mr-1.5" /> Browse Universities
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Application Status */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
              <FileText size={15} className="text-indigo-400" />
            </div>
            <h2 className="text-white font-black tracking-tight">Applications</h2>
          </div>
          {appsLoading ? (
            <LoadingSpinner size="sm" />
          ) : applications.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={FileText}
                title="No applications yet"
                description="Run matchmaking to find your top universities and apply."
                action={{ label: "Run Match", onClick: () => {} }}
                className="py-8"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <StatusBadge status={status} />
                  <span className="text-white font-black text-sm">{count}</span>
                </div>
              ))}
              <Link
                href="/student/applications"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-bold pt-2 transition-colors"
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
              <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                <TrendingUp size={15} className="text-violet-400" />
              </div>
              <h2 className="text-white font-black tracking-tight">Top Matches</h2>
            </div>
            <Link
              href="/student/match"
              className="text-indigo-400 text-xs hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {topMatches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="Run matchmaking to see your top universities ranked by fit score."
              action={{ label: "Run Match Now", onClick: () => {} }}
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {topMatches.map((result, i) => {
                const pct = Math.round(result.score.total);
                const isHigh = pct >= 80;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-white/3 border border-white/6 hover:border-indigo-500/25 hover:bg-indigo-600/5 transition-all duration-200"
                  >
                    <div className="relative shrink-0">
                      {isHigh ? (
                        <div className="glow-green" style={{ inset: "-8px" }} />
                      ) : (
                        <div className="glow-indigo" style={{ inset: "-8px" }} />
                      )}
                      <div
                        className={`relative w-13 h-13 rounded-xl border flex flex-col items-center justify-center z-10 ${
                          isHigh
                            ? "bg-emerald-950/60 border-emerald-500/30"
                            : "bg-indigo-950/60 border-indigo-500/30"
                        }`}
                        style={{ width: 52, height: 52 }}
                      >
                        <span
                          className={`font-black text-base tracking-tight leading-none ${
                            isHigh ? "text-emerald-400" : "text-indigo-400"
                          }`}
                        >
                          {pct}%
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">fit</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-black tracking-tight text-sm truncate">
                        {result.university.name}
                      </div>
                      <div className="text-slate-400 text-xs font-medium mt-0.5">
                        {result.program.name} · {result.university.country}
                      </div>
                    </div>
                    {/* Mini bar */}
                    <div className="w-16 h-1.5 bg-white/6 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          isHigh
                            ? "bg-gradient-to-r from-emerald-500 to-green-400"
                            : "bg-gradient-to-r from-indigo-600 to-blue-400"
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
              <div className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center">
                <CheckCircle2 size={15} className="text-slate-400" />
              </div>
              <h2 className="text-white font-black tracking-tight">Recent Activity</h2>
            </div>
            <Link
              href="/student/applications"
              className="text-indigo-400 text-xs hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {applications.slice(0, 5).map((app) => (
              <Link key={app.id} href={`/student/applications/${app.id}`}>
                <div className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/4 transition-colors group">
                  <div>
                    <div className="text-white text-sm font-bold group-hover:text-indigo-300 transition-colors">
                      {app.university?.name ?? "University"}
                    </div>
                    <div className="text-slate-500 text-xs font-medium">{app.program?.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <ArrowRight size={13} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
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
