"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bookmark,
  DollarSign,
  Star,
  X,
  BadgeCheck,
  UserCheck,
  MapPin,
  BarChart3,
} from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";
import Providers from "@/components/Providers";

interface ShortlistItem {
  id: string;
  university_id: string;
  added_by_role: "student" | "consultant";
  note: string | null;
  added_at: string;
  university: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    ranking_qs: number | null;
    tuition_usd_per_year: number | null;
    scholarships_available: boolean | null;
    max_scholarship_pct: number | null;
    min_ielts: number | null;
    min_gpa_percentage: number | null;
    acceptance_rate_bd: number | null;
    website: string | null;
  } | null;
}

function StudentShortlistContent() {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ShortlistItem[]>({
    queryKey: ["shortlist"],
    queryFn: async () => {
      const res = await api.get("/shortlist");
      return res.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await api.delete(`/shortlist/${universityId}`);
    },
    onSuccess: () => {
      toast.success("Removed from shortlist");
      qc.invalidateQueries({ queryKey: ["shortlist"] });
      qc.invalidateQueries({ queryKey: ["shortlist-check"] });
    },
    onError: () => toast.error("Failed to remove"),
  });

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <Sidebar role="student" />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Bookmark size={16} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">My Shortlist</h1>
              <p className="text-slate-500 text-sm">
                {items.length > 0
                  ? `${items.length} saved uni${items.length === 1 ? "" : "s"}`
                  : "Save unis from Browse or Match to compare them here"}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading shortlist..." />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No universities saved yet"
            description="Browse universities or run a match to find the best fits, then save them here to compare."
            action={{
              label: "Start Exploring Universities",
              onClick: () => (window.location.href = "/universities"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((item) => {
              const uni = item.university;
              if (!uni) return null;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden group relative"
                >
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeMutation.mutate(item.university_id);
                    }}
                    disabled={removeMutation.isPending}
                    className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Remove from shortlist"
                  >
                    <X size={14} />
                  </button>

                  <Link href={`/universities/${uni.id}`} className="block">
                    {/* Cover Image Placeholder */}
                    <div className="relative h-[100px] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-slate-300 flex flex-col items-center gap-1">
                          <MapPin size={20} strokeWidth={1.5} />
                          <span className="text-[10px] font-medium uppercase tracking-wider">
                            {uni.country}
                          </span>
                        </div>
                      </div>

                      {/* QS Ranking badge floating over image */}
                      {uni.ranking_qs && (
                        <Badge className="absolute top-2.5 right-10 bg-amber-50 text-amber-700 border border-amber-200 shadow-sm text-[10px] font-semibold">
                          <Star size={9} className="mr-1 fill-amber-400 text-amber-400" /> QS #{uni.ranking_qs}
                        </Badge>
                      )}

                      {/* Consultant badge */}
                      {item.added_by_role === "consultant" && (
                        <Badge className="absolute bottom-2.5 left-2.5 bg-blue-50 text-blue-600 border border-blue-200 text-[10px]">
                          <UserCheck size={9} className="mr-1" /> Added by Consultant
                        </Badge>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="text-slate-900 font-semibold text-sm leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {uni.name}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                        <MapPin size={10} />
                        {uni.city ? `${uni.city}, ` : ""}
                        {uni.country}
                      </p>

                      {/* Soft pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {uni.tuition_usd_per_year && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <DollarSign size={9} />
                            ${uni.tuition_usd_per_year.toLocaleString()}/yr
                          </span>
                        )}
                        {uni.acceptance_rate_bd && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            <BarChart3 size={9} />
                            {uni.acceptance_rate_bd}% BD accept
                          </span>
                        )}
                        {uni.min_ielts && (
                          <span className="text-[10px] font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                            IELTS {uni.min_ielts}+
                          </span>
                        )}
                        {uni.scholarships_available && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            <BadgeCheck size={9} />
                            Scholarships{uni.max_scholarship_pct ? ` ${uni.max_scholarship_pct}%` : ""}
                          </span>
                        )}
                      </div>

                      {item.note && (
                        <p className="text-slate-400 text-xs mt-3 italic border-l-2 border-slate-200 pl-2">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudentShortlistPage() {
  return (
    <Providers>
      <StudentShortlistContent />
    </Providers>
  );
}
