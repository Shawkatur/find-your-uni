"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, Zap, Trophy, Globe } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { MatchResultItem } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MatchResultCard } from "@/components/match/MatchResultCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

const LOADING_STEPS = [
  "Scanning 1,200+ universities...",
  "Analyzing QS rankings & tuition costs...",
  "Calculating Bangladeshi acceptance rates...",
  "Running AI profile matching...",
  "Ranking universities by fit score...",
];

export default function MatchPage() {
  const qc = useQueryClient();
  const [hasRun, setHasRun] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const { data: results = [], isLoading: resultsLoading } = useQuery<MatchResultItem[]>({
    queryKey: ["match-results"],
    queryFn: async () => {
      try {
        const res = await api.get("/match/results");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
  });

  const runMatch = useMutation({
    mutationFn: async () => {
      let step = 0;
      const interval = setInterval(() => {
        step = (step + 1) % LOADING_STEPS.length;
        setLoadingStep(step);
      }, 3000);
      try {
        const res = await api.post("/match");
        return res.data as MatchResultItem[];
      } finally {
        clearInterval(interval);
        setLoadingStep(0);
      }
    },
    onSuccess: (data) => {
      const count = Array.isArray(data) ? data.length : 0;
      toast.success(count > 0 ? `Found ${count} matched universities!` : "No matches yet — try updating your profile.");
      qc.invalidateQueries({ queryKey: ["match-results"] });
      qc.invalidateQueries({ queryKey: ["match-results-preview"] });
      setHasRun(true);
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.response?.data?.detail as string | undefined;
      if (detail?.toLowerCase().includes("student profile not found")) {
        toast.error("Your student profile is incomplete. Please complete registration first.", { duration: 6000 });
        setTimeout(() => { window.location.href = "/auth/register/student"; }, 3000);
        return;
      }
      toast.error(detail ?? "Matchmaking failed. Please try again.");
    },
  });

  const isEmpty = !resultsLoading && results.length === 0;
  const highMatches = results.filter((r) => Math.round(r.score * 100) >= 80).length;

  return (
    <PageWrapper
      title="University Match"
      subtitle="AI-powered matching based on your academic profile and preferences."
      actions={
        results.length > 0 && (
          <Button
            variant="outline"
            onClick={() => runMatch.mutate()}
            disabled={runMatch.isPending}
          >
            <RefreshCw size={14} className={`mr-2 ${runMatch.isPending ? "animate-spin" : ""}`} />
            Refresh Results
          </Button>
        )
      }
    >
      {/* Hero — shown when no results yet */}
      {isEmpty && !hasRun && !runMatch.isPending && (
        <div className="relative flex flex-col items-center text-center py-10 md:py-20 overflow-hidden">
          {/* Background radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(79,70,229,0.15) 0%, transparent 70%)",
            }}
          />

          {/* Icon */}
          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)",
                filter: "blur(24px)",
              }}
            />
            <div className="relative w-24 h-24 rounded-3xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={40} className="text-indigo-400" />
            </div>
          </div>

          <h2 className="relative text-2xl sm:text-4xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Find Your Best Universities
            </span>
          </h2>
          <p className="relative text-slate-400 max-w-md mx-auto mb-3 leading-relaxed">
            Our AI analyzes your academic profile against <strong className="text-white">1,200+ universities</strong> using
            QS rankings, cost efficiency, and Bangladeshi acceptance rates.
          </p>

          {/* Feature pills */}
          <div className="relative flex flex-wrap gap-2 justify-center mb-10">
            <span className="tag-pill tag-pill-indigo"><Zap size={9} /> QS Rankings</span>
            <span className="tag-pill tag-pill-green"><Globe size={9} /> BD Acceptance</span>
            <span className="tag-pill tag-pill-purple"><Sparkles size={9} /> AI Matching</span>
          </div>

          <Button
            size="xl"
            onClick={() => runMatch.mutate()}
            disabled={runMatch.isPending}
            className="relative"
          >
            <Sparkles size={18} className="mr-2" />
            Calculate My Matches
          </Button>
        </div>
      )}

      {/* Loading State */}
      {runMatch.isPending && (
        <div className="flex flex-col items-center justify-center py-10 md:py-20 gap-6">
          {/* Animated rings */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-600/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/50 animate-spin" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-4 rounded-full border-2 border-t-indigo-400 border-transparent animate-spin" style={{ animationDuration: "1s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={18} className="text-indigo-400" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-white font-bold text-lg mb-1 transition-all duration-500">
              {LOADING_STEPS[loadingStep]}
            </p>
            <p className="text-slate-500 text-sm">This usually takes 10–20 seconds.</p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i <= loadingStep ? "bg-indigo-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!runMatch.isPending && results.length > 0 && (
        <div>
          {/* Results header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between mb-6">
            <div>
              <p className="text-white font-black text-lg">
                {results.length} universities matched
              </p>
              <p className="text-slate-500 text-sm mt-0.5">
                Ranked by fit score · your profile vs. admission requirements
              </p>
            </div>
            {highMatches > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20">
                <Trophy size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold text-sm">{highMatches} High Matches</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {results.map((result, i) => (
              <MatchResultCard key={i} result={result} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Empty after run */}
      {isEmpty && hasRun && !runMatch.isPending && (
        <EmptyState
          icon={Sparkles}
          title="No matches found"
          description="Try updating your profile with test scores or expanding your target countries and degree level."
          action={{ label: "Edit Profile", onClick: () => (window.location.href = "/student/profile") }}
        />
      )}
    </PageWrapper>
  );
}
