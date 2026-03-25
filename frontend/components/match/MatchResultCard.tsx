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
import { ShortlistButton } from "@/components/shortlist/ShortlistButton";

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
        university_id: result.university_id,
        program_id: result.program_id,
      });
    },
    onSuccess: () => {
      toast.success("Application created!");
      qc.invalidateQueries({ queryKey: ["student-applications"] });
    },
    onError: () => toast.error("Failed to create application"),
  });

  const pct = Math.round(result.score * 100);

  const isHighMatch = pct >= 80;
  const isMidMatch = pct >= 60;

  const scoreColor = isHighMatch
    ? "text-[#059669]"
    : isMidMatch
    ? "text-[#2563EB]"
    : "text-[#D97706]";

  const barColor = isHighMatch
    ? "from-[#10B981] to-[#34D399]"
    : isMidMatch
    ? "from-[#3B82F6] to-[#60A5FA]"
    : "from-[#F59E0B] to-[#FBBF24]";

  // Rank badge color
  const rankColor =
    rank === 1
      ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
      : rank === 2
      ? "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
      : rank === 3
      ? "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]"
      : "bg-[#F8F9FA] text-[#94A3B8] border-[#E2E8F0]";

  return (
    <GlassCard hover className="transition-all duration-300 overflow-hidden">
      {/* Rank stripe at top-left corner */}
      {rank <= 3 && (
        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-[1.25rem] ${
          rank === 1 ? "bg-gradient-to-b from-[#FBBF24] to-[#FBBF24]/0" :
          rank === 2 ? "bg-gradient-to-b from-[#94A3B8] to-[#94A3B8]/0" :
          "bg-gradient-to-b from-[#FB923C] to-[#FB923C]/0"
        }`} />
      )}

      <div className="flex items-start gap-3 sm:gap-5">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            <div
              className={`relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center z-10 border ${
                isHighMatch
                  ? "bg-[#ECFDF5] border-[rgba(16,185,129,0.3)]"
                  : isMidMatch
                  ? "bg-[#EFF6FF] border-[rgba(59,130,246,0.3)]"
                  : "bg-[#FFFBEB] border-[rgba(245,158,11,0.3)]"
              }`}
            >
              <span className={`text-2xl font-black tracking-tight leading-none ${scoreColor}`}>
                {pct}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8] mt-0.5">
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
              <h3 className="text-[#333] font-black tracking-tight leading-snug truncate">
                {result.university_name}
              </h3>
              <p className="text-[#475569] text-sm font-semibold mt-0.5">{result.program_name}</p>
              <p className="text-[#94A3B8] text-xs mt-0.5 flex items-center gap-1">
                <Globe size={10} />
                {result.country}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 items-end">
              {isHighMatch && (
                <span className="tag-pill tag-pill-green flex items-center gap-1">
                  <Sparkles size={8} /> Great Fit
                </span>
              )}
              {result.ranking_qs && (
                <span className="flex items-center gap-1 text-[#D97706] text-xs font-bold">
                  <Star size={10} fill="currentColor" /> QS #{result.ranking_qs}
                </span>
              )}
              {result.tuition_usd_per_year && (
                <span className="flex items-center gap-1 text-[#64748B] text-xs font-medium">
                  <DollarSign size={10} />
                  ${result.tuition_usd_per_year.toLocaleString()}/yr
                </span>
              )}
            </div>
          </div>

          {/* Match bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide">Fit Score</span>
              <span className={`text-[11px] font-black ${scoreColor}`}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Score breakdown */}
          {expanded && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mb-3">
              {[
                { label: "Ranking", value: Math.round((result.breakdown?.ranking ?? 0) * 100), icon: Star },
                { label: "Cost Fit", value: Math.round((result.breakdown?.cost_efficiency ?? 0) * 100), icon: DollarSign },
                { label: "BD Accept", value: Math.round((result.breakdown?.bd_acceptance ?? 0) * 100), icon: Globe },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-center"
                >
                  <Icon size={13} className="text-[#94A3B8] mx-auto mb-1.5" />
                  <div className="text-[#333] font-black text-sm tracking-tight">{value}%</div>
                  <div className="text-[#94A3B8] text-[9px] uppercase tracking-widest font-bold mt-0.5">
                    {label}
                  </div>
                  <Progress value={value} className="h-1 mt-2 bg-[#F1F5F9]" />
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {result.ai_summary && (
            <p className="text-[#64748B] text-xs italic mb-3 leading-relaxed border-l-2 border-[#10B981]/30 pl-3">
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
            <ShortlistButton universityId={result.university_id} size="sm" />
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[#64748B] hover:text-[#10B981] text-xs transition-colors font-semibold"
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
