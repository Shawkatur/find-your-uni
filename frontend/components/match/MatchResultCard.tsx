"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, DollarSign, Globe, ChevronDown, ChevronUp, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { MatchResultItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/layout/GlassCard";

interface MatchResultCardProps {
  result: MatchResultItem;
  rank: number;
}

export function MatchResultCard({ result, rank }: MatchResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: async () => {
      await api.post("/applications", {
        university_id: result.university.id,
        program_id: result.program.id,
      });
    },
    onSuccess: () => {
      toast.success("Application created!");
      qc.invalidateQueries({ queryKey: ["student-applications"] });
    },
    onError: () => toast.error("Failed to create application"),
  });

  const score = result.score;
  const pct = Math.round(score.total);

  const isHighMatch = pct >= 80;
  const isMidMatch = pct >= 60;

  const scoreColor = isHighMatch
    ? "text-emerald-400"
    : isMidMatch
    ? "text-indigo-400"
    : "text-yellow-400";

  const barColor = isHighMatch
    ? "from-emerald-500 to-green-400"
    : isMidMatch
    ? "from-indigo-600 to-blue-400"
    : "from-yellow-500 to-orange-400";

  // Rank badge color
  const rankColor =
    rank === 1
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
      : rank === 2
      ? "bg-slate-400/10 text-slate-300 border-slate-400/20"
      : rank === 3
      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
      : "bg-white/5 text-slate-500 border-white/8";

  return (
    <GlassCard hover className="transition-all duration-300 overflow-hidden">
      {/* Rank stripe at top-left corner */}
      {rank <= 3 && (
        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-[1.25rem] ${
          rank === 1 ? "bg-gradient-to-b from-yellow-400 to-yellow-600/0" :
          rank === 2 ? "bg-gradient-to-b from-slate-400 to-slate-400/0" :
          "bg-gradient-to-b from-orange-400 to-orange-400/0"
        }`} />
      )}

      <div className="flex items-start gap-5">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            {isHighMatch ? (
              <div className="match-radial-glow-green" />
            ) : (
              <div className="match-radial-glow" />
            )}
            <div
              className={`relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center z-10 border ${
                isHighMatch
                  ? "bg-emerald-950/60 border-emerald-500/30"
                  : isMidMatch
                  ? "bg-indigo-950/60 border-indigo-500/30"
                  : "bg-yellow-950/40 border-yellow-500/20"
              }`}
              style={{
                boxShadow: isHighMatch
                  ? "0 0 40px rgba(16,185,129,0.25)"
                  : isMidMatch
                  ? "0 0 40px rgba(79,70,229,0.25)"
                  : "none",
              }}
            >
              <span className={`text-2xl font-black tracking-tight leading-none ${scoreColor}`}>
                {pct}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-current mt-0.5">
                match
              </span>
            </div>
          </div>
          {/* Rank badge */}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rankColor}`}>
            #{rank}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="text-white font-black tracking-tight leading-snug truncate">
                {result.university.name}
              </h3>
              <p className="text-slate-300 text-sm font-semibold mt-0.5">{result.program.name}</p>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                <Globe size={10} />
                {result.university.country}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 items-end">
              {isHighMatch && (
                <span className="tag-pill tag-pill-green flex items-center gap-1">
                  <Sparkles size={8} /> High Match
                </span>
              )}
              {result.university.qs_rank && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                  <Star size={10} fill="currentColor" /> QS #{result.university.qs_rank}
                </span>
              )}
              {result.university.annual_tuition_usd && (
                <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <DollarSign size={10} />
                  ${result.university.annual_tuition_usd.toLocaleString()}/yr
                </span>
              )}
            </div>
          </div>

          {/* Match bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Fit Score</span>
              <span className={`text-[11px] font-black ${scoreColor}`}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Score breakdown */}
          {expanded && (
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {[
                { label: "Ranking", value: Math.round(score.ranking * 100), icon: Star },
                { label: "Cost Fit", value: Math.round(score.cost_efficiency * 100), icon: DollarSign },
                { label: "BD Accept", value: Math.round(score.bd_acceptance * 100), icon: Globe },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-white/4 border border-white/6 rounded-xl p-3 text-center"
                >
                  <Icon size={13} className="text-slate-500 mx-auto mb-1.5" />
                  <div className="text-white font-black text-sm tracking-tight">{value}%</div>
                  <div className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mt-0.5">
                    {label}
                  </div>
                  <Progress value={value} className="h-1 mt-2 bg-white/6" />
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {result.ai_summary && (
            <p className="text-slate-400 text-xs italic mb-3 leading-relaxed border-l-2 border-indigo-500/35 pl-3">
              {result.ai_summary}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="px-5"
            >
              <Zap size={13} className="mr-1" />
              {applyMutation.isPending ? "Creating..." : "Apply Now"}
            </Button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-slate-500 hover:text-indigo-400 text-xs transition-colors font-semibold"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Hide breakdown" : "Score breakdown"}
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
