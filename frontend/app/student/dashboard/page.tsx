"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Sparkles, FileText, Upload, Building2, Clock, TrendingUp, ArrowRight } from "lucide-react";
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

  return (
    <PageWrapper>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-slate-400 mt-1 font-normal">Here&apos;s what&apos;s happening with your applications.</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/student/match">
          <Button>
            <Sparkles size={15} className="mr-1.5" /> Run Match
          </Button>
        </Link>
        <Link href="/student/documents">
          <Button variant="outline">
            <Upload size={15} className="mr-1.5" /> Upload Document
          </Button>
        </Link>
        <Link href="/universities">
          <Button variant="outline">
            <Building2 size={15} className="mr-1.5" /> Browse Universities
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Application Status Summary */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
              <FileText size={15} className="text-blue-400" />
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
              <Link href="/student/applications" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-semibold pt-2 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </GlassCard>

        {/* Top Match Results */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
                <TrendingUp size={15} className="text-purple-400" />
              </div>
              <h2 className="text-white font-black tracking-tight">Top Matches</h2>
            </div>
            <Link href="/student/match" className="text-blue-400 text-xs hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors">
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
                  <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-900/40 border border-white/6 hover:border-blue-500/20 transition-colors">
                    <div className="relative shrink-0">
                      <div className={isHigh ? "glow-green" : "glow-blue"} style={{ inset: "-6px" }} />
                      <div className="relative w-12 h-12 bg-slate-800/80 rounded-xl border border-white/10 flex flex-col items-center justify-center">
                        <span className={`font-black text-sm tracking-tight leading-none ${isHigh ? "text-emerald-400" : "text-blue-400"}`}>{pct}%</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">fit</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-black tracking-tight text-sm truncate">{result.university.name}</div>
                      <div className="text-slate-400 text-xs font-medium">{result.program.name} · {result.university.country}</div>
                    </div>
                    <div className="w-20 h-1.5 bg-white/8 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${isHigh ? "bg-gradient-to-r from-emerald-500 to-green-400" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`}
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
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center">
                <Clock size={15} className="text-slate-400" />
              </div>
              <h2 className="text-white font-black tracking-tight">Recent Activity</h2>
            </div>
            <Link href="/student/applications" className="text-blue-400 text-xs hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {applications.slice(0, 5).map((app) => (
              <Link key={app.id} href={`/student/applications/${app.id}`}>
                <div className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div>
                    <div className="text-white text-sm font-semibold group-hover:text-blue-300 transition-colors">{app.university?.name ?? "University"}</div>
                    <div className="text-slate-500 text-xs font-medium">{app.program?.name}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      )}
    </PageWrapper>
  );
}
