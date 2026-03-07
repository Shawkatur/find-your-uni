"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Star, DollarSign, Globe, ChevronDown, ChevronUp } from "lucide-react";
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

  const scoreColor = pct >= 80 ? "text-green-400" : pct >= 60 ? "text-blue-400" : "text-yellow-400";
  const barColor = pct >= 80
    ? "from-green-500 to-emerald-400"
    : pct >= 60
    ? "from-blue-500 to-cyan-400"
    : "from-yellow-500 to-orange-400";

  return (
    <GlassCard className="glass-card-hover">
      <div className="flex items-start gap-5">
        {/* Rank & Score */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-10 h-10 bg-white/8 rounded-xl flex items-center justify-center">
            <span className="text-slate-400 font-semibold text-sm">#{rank}</span>
          </div>
          <span className={`text-lg font-bold ${scoreColor}`}>{pct}%</span>
          <span className="text-slate-500 text-xs">match</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="text-white font-semibold">{result.university.name}</h3>
              <p className="text-slate-400 text-sm">{result.program.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{result.university.country}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0 items-end">
              {result.university.qs_rank && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs">
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
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`}
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
                <div key={label} className="bg-white/4 rounded-lg p-2.5 text-center">
                  <Icon size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white font-semibold text-sm">{value}%</div>
                  <div className="text-slate-500 text-xs">{label}</div>
                  <Progress value={value} className="h-1 mt-1.5 bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {result.ai_summary && (
            <p className="text-slate-400 text-sm italic mb-3 leading-relaxed">
              &ldquo;{result.ai_summary}&rdquo;
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {applyMutation.isPending ? "Creating..." : "Apply Now"}
            </Button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Less" : "Score breakdown"}
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
