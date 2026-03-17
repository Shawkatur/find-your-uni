"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Info } from "lucide-react";
import api from "@/lib/api";
import type { MatchSettings } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminSettingsPage() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<MatchSettings>({
    queryKey: ["match-settings"],
    queryFn: async () => {
      const res = await api.get("/admin/match-settings");
      return res.data;
    },
  });

  const [weights, setWeights] = useState({
    weight_ranking: 0.4,
    weight_cost: 0.35,
    weight_bd_acceptance: 0.25,
    ai_top_n: 5,
    budget_buffer_pct: 20,
  });

  useEffect(() => {
    if (settings) {
      setWeights({
        weight_ranking: settings.weight_ranking,
        weight_cost: settings.weight_cost,
        weight_bd_acceptance: settings.weight_bd_acceptance,
        ai_top_n: settings.ai_top_n,
        budget_buffer_pct: settings.budget_buffer_pct,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/admin/match-settings", weights);
    },
    onSuccess: () => {
      toast.success("Settings saved!");
      qc.invalidateQueries({ queryKey: ["match-settings"] });
    },
    onError: () => toast.error("Failed to save settings."),
  });

  const totalWeight = weights.weight_ranking + weights.weight_cost + weights.weight_bd_acceptance;
  const weightValid = Math.abs(totalWeight - 1.0) < 0.01;

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <PageWrapper
      title="Match Settings"
      subtitle="Configure how universities are ranked in match results."
      actions={
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !weightValid}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save size={15} className="mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      }
    >
      <div className="max-w-2xl space-y-6">
        {/* Weight warning */}
        {!weightValid && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <Info size={16} className="text-yellow-400" />
            <p className="text-yellow-300 text-sm">
              Weights must sum to 1.0 (currently: {totalWeight.toFixed(2)})
            </p>
          </div>
        )}

        {/* Score Weights */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-1">Score Weights</h3>
          <p className="text-slate-400 text-sm mb-6">Must sum to 1.0. Current total: <span className={weightValid ? "text-green-400" : "text-yellow-400"}>{totalWeight.toFixed(2)}</span></p>

          <div className="space-y-6">
            {[
              { key: "weight_ranking" as const, label: "QS Ranking", description: "Higher weight favors top-ranked universities" },
              { key: "weight_cost" as const, label: "Cost Efficiency", description: "Higher weight favors affordable universities" },
              { key: "weight_bd_acceptance" as const, label: "BD Acceptance Rate", description: "Higher weight favors universities that accept BD students" },
            ].map(({ key, label, description }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-slate-200 font-medium">{label}</Label>
                    <p className="text-slate-500 text-xs mt-0.5">{description}</p>
                  </div>
                  <span className="text-white font-bold text-lg w-16 text-right">
                    {weights[key].toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights[key]}
                  onChange={(e) => setWeights((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 appearance-none bg-white/10 rounded-full accent-blue-500"
                />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Settings */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-5">AI Settings</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label className="text-slate-300 mb-1.5 block">AI Top-N Results</Label>
              <Input
                type="number"
                value={weights.ai_top_n}
                onChange={(e) => setWeights((prev) => ({ ...prev, ai_top_n: parseInt(e.target.value) || 5 }))}
                min={1}
                max={20}
                className="bg-white/8 border-white/10 text-white"
              />
              <p className="text-slate-500 text-xs mt-1">Number of results to include AI summaries for</p>
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Budget Buffer (%)</Label>
              <Input
                type="number"
                value={weights.budget_buffer_pct}
                onChange={(e) => setWeights((prev) => ({ ...prev, budget_buffer_pct: parseInt(e.target.value) || 20 }))}
                min={0}
                max={100}
                className="bg-white/8 border-white/10 text-white"
              />
              <p className="text-slate-500 text-xs mt-1">Allow universities up to X% above student budget</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
