"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, DollarSign, Globe, ChevronDown, ChevronUp } from "lucide-react";
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

  const scoreColor = isHighMatch ? "text-emerald-400" : isMidMatch ? "text-blue-400" : "text-yellow-400";
  const glowClass = isHighMatch ? "glow-green" : "glow-blue";
  const barColor = isHighMatch
    ? "from-emerald-500 to-green-400"
    : isMidMatch
    ? "from-blue-500 to-cyan-400"
    : "from-yellow-500 to-orange-400";

  return (
    <GlassCard hover className="transition-all duration-200">
      <div className="flex items-start gap-5">
        {/* Score ring with glow */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative">
            <div className={glowClass} />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col items-center justify-center z-10">
              <span className={`text-xl font-black tracking-tight leading-none ${scoreColor}`}>{pct}%</span>
              <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wide">match</span>
            </div>
          </div>
          <span className="text-slate-500 text-xs font-medium mt-1">#{rank}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-white font-black tracking-tight">{result.university.name}</h3>
              <p className="text-slate-300 text-sm font-medium mt-0.5">{result.program.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{result.university.country}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 items-end">
              {isHighMatch && (
                <span className="tag-pill tag-pill-green">High Match</span>
              )}
              {result.university.qs_rank && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                  <Star size={11} /> QS #{result.university.qs_rank}
                </span>
              )}
              {result.university.annual_tuition_usd && (
                <span className="flex items-center gap-1 text-slate-400 text-xs">
                  <DollarSign size={11} />
                  ${result.university.annual_tuition_usd.toLocaleString()}/yr
                </span>
              )}
            </div>
          </div>

          {/* Overall score bar */}
          <div className="mb-3">
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Score breakdown */}
          {expanded && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "Ranking", value: Math.round(score.ranking * 100), icon: Star },
                { label: "Cost Fit", value: Math.round(score.cost_efficiency * 100), icon: DollarSign },
                { label: "BD Accept", value: Math.round(score.bd_acceptance * 100), icon: Globe },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-900/60 border border-white/8 rounded-xl p-3 text-center">
                  <Icon size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white font-black text-sm tracking-tight">{value}%</div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-wide font-medium">{label}</div>
                  <Progress value={value} className="h-1 mt-2 bg-white/8" />
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {result.ai_summary && (
            <p className="text-slate-400 text-sm italic mb-3 leading-relaxed border-l-2 border-blue-500/30 pl-3">
              {result.ai_summary}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? "Creating..." : "Apply Now"}
            </Button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-slate-400 hover:text-blue-400 text-xs transition-colors font-medium"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Hide breakdown" : "Score breakdown"}
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
