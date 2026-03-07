"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { MatchResultItem } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MatchResultCard } from "@/components/match/MatchResultCard";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MatchPage() {
  const qc = useQueryClient();
  const [hasRun, setHasRun] = useState(false);

  const { data: results = [], isLoading: resultsLoading } = useQuery<MatchResultItem[]>({
    queryKey: ["match-results"],
    queryFn: async () => {
      const res = await api.get("/match/results");
      return res.data?.results ?? [];
    },
  });

  const runMatch = useMutation({
    mutationFn: async () => {
      const res = await api.post("/match");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data?.results?.length ?? 0} matched universities!`);
      qc.invalidateQueries({ queryKey: ["match-results"] });
      qc.invalidateQueries({ queryKey: ["match-results-preview"] });
      setHasRun(true);
    },
    onError: () => toast.error("Matchmaking failed. Please try again."),
  });

  const isEmpty = !resultsLoading && results.length === 0;

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
            className="border-white/10 text-slate-300 hover:bg-white/8"
          >
            <RefreshCw size={14} className={`mr-2 ${runMatch.isPending ? "animate-spin" : ""}`} />
            Refresh Results
          </Button>
        )
      }
    >
      {/* Run Matchmaking Hero */}
      {isEmpty && !hasRun && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Sparkles size={36} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Find Your Best Universities</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Our AI analyzes your profile against 1,200+ universities using QS rankings,
            cost efficiency, and Bangladeshi acceptance rates.
          </p>
          <Button
            onClick={() => runMatch.mutate()}
            disabled={runMatch.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 text-base font-semibold"
          >
            {runMatch.isPending ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" /> Running Match...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" /> Run Matchmaking
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading */}
      {runMatch.isPending && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400">Analyzing your profile across 1,200+ universities...</p>
          <p className="text-slate-500 text-sm">This usually takes 10–20 seconds.</p>
        </div>
      )}

      {/* Results */}
      {!runMatch.isPending && results.length > 0 && (
        <div>
          <p className="text-slate-400 mb-6 text-sm">
            Found <span className="text-white font-semibold">{results.length}</span> matched universities, ranked by fit score.
          </p>
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
          description="Try updating your profile with test scores or expanding your preferences."
          action={{ label: "Edit Profile", onClick: () => window.location.href = "/student/profile" }}
        />
      )}
    </PageWrapper>
  );
}
