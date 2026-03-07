"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Sparkles, FileText, Upload, Building2, Clock, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Application, MatchResultItem } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

  return (
    <PageWrapper>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(" ")[0] ?? "Student"} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your applications.</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/student/match">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Sparkles size={15} className="mr-2" /> Run Match
          </Button>
        </Link>
        <Link href="/student/documents">
          <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/8">
            <Upload size={15} className="mr-2" /> Upload Document
          </Button>
        </Link>
        <Link href="/universities">
          <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/8">
            <Building2 size={15} className="mr-2" /> Browse Universities
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Application Status Summary */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-blue-400" />
            <h2 className="text-white font-semibold">Applications</h2>
          </div>
          {appsLoading ? (
            <LoadingSpinner size="sm" />
          ) : applications.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-3">No applications yet.</p>
              <Link href="/student/match">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Run Match</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Top Match Results */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-400" />
              <h2 className="text-white font-semibold">Top Matches</h2>
            </div>
            <Link href="/student/match" className="text-blue-400 text-sm hover:text-blue-300">
              View all →
            </Link>
          </div>
          {topMatches.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles size={28} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">Run matchmaking to see your top universities.</p>
              <Link href="/student/match">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Run Match Now</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topMatches.map((result, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/4">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-blue-400 font-bold text-sm">{Math.round(result.score.total)}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{result.university.name}</div>
                    <div className="text-slate-400 text-xs">{result.program.name} · {result.university.country}</div>
                  </div>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                      style={{ width: `${result.score.total}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <GlassCard className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <h2 className="text-white font-semibold">Recent Activity</h2>
            </div>
            <Link href="/student/applications" className="text-blue-400 text-sm hover:text-blue-300">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => (
              <Link key={app.id} href={`/student/applications/${app.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/6 transition-colors">
                  <div>
                    <div className="text-white text-sm font-medium">{app.university?.name ?? "University"}</div>
                    <div className="text-slate-400 text-xs">{app.program?.name}</div>
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
