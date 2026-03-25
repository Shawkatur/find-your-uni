"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bookmark,
  Building2,
  DollarSign,
  Star,
  X,
  BadgeCheck,
  UserCheck,
} from "lucide-react";
import api from "@/lib/api";
import { GlassCard } from "@/components/layout/GlassCard";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar role="student" />
      <main className="flex-1 md:ml-64 p-6 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark size={20} className="text-[#10B981]" />
            <h1 className="text-2xl font-bold text-[#333]">My Shortlist</h1>
          </div>
          <p className="text-[#64748B] text-sm">
            {items.length > 0
              ? `${items.length} saved uni${items.length === 1 ? "" : "s"}`
              : "Save unis from Browse or Match to compare them here"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading shortlist..." />
          </div>
        ) : items.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Bookmark size={40} className="text-[#94A3B8] mx-auto mb-4" />
            <p className="text-[#64748B] text-sm mb-4">No unis saved yet</p>
            <Link
              href="/universities"
              className="text-[#10B981] hover:text-[#059669] text-sm font-medium"
            >
              Browse Unis →
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((item) => {
              const uni = item.university;
              if (!uni) return null;
              return (
                <GlassCard key={item.id} className="relative group">
                  {/* Remove button */}
                  <button
                    onClick={() => removeMutation.mutate(item.university_id)}
                    disabled={removeMutation.isPending}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from shortlist"
                  >
                    <X size={14} />
                  </button>

                  <Link href={`/universities/${uni.id}`} className="block">
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      <div className="w-10 h-10 bg-[rgba(16,185,129,0.06)] rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-[#10B981]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[#333] font-semibold text-sm leading-snug line-clamp-2">
                          {uni.name}
                        </h3>
                        <p className="text-[#64748B] text-xs mt-0.5">
                          {uni.city ? `${uni.city}, ` : ""}
                          {uni.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {uni.ranking_qs && (
                        <Badge
                          variant="outline"
                          className="border-[#FDE68A] text-[#D97706] bg-[#FFFBEB] text-[10px]"
                        >
                          <Star size={9} className="mr-1" /> QS #{uni.ranking_qs}
                        </Badge>
                      )}
                      {uni.scholarships_available && (
                        <Badge
                          variant="outline"
                          className="border-[rgba(16,185,129,0.2)] text-[#059669] bg-[rgba(16,185,129,0.05)] text-[10px]"
                        >
                          <BadgeCheck size={9} className="mr-1" />
                          Scholarships
                          {uni.max_scholarship_pct ? ` up to ${uni.max_scholarship_pct}%` : ""}
                        </Badge>
                      )}
                      {item.added_by_role === "consultant" && (
                        <Badge
                          variant="outline"
                          className="border-[rgba(59,130,246,0.2)] text-[#2563EB] bg-[rgba(59,130,246,0.05)] text-[10px]"
                        >
                          <UserCheck size={9} className="mr-1" /> By Consultant
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#E2E8F0] pt-3">
                      {uni.tuition_usd_per_year ? (
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <DollarSign size={11} className="text-[#64748B]" />
                          ${uni.tuition_usd_per_year.toLocaleString()}/yr
                        </div>
                      ) : (
                        <span />
                      )}
                      {uni.min_ielts && (
                        <div className="text-[#64748B]">
                          IELTS: <span className="text-[#333] font-medium">{uni.min_ielts}+</span>
                        </div>
                      )}
                      {uni.min_gpa_percentage && (
                        <div className="text-[#64748B]">
                          GPA: <span className="text-[#333] font-medium">{uni.min_gpa_percentage}%+</span>
                        </div>
                      )}
                      {uni.acceptance_rate_bd && (
                        <div className="text-[#059669]">
                          {uni.acceptance_rate_bd}% BD accept
                        </div>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-[#64748B] text-xs mt-2 italic border-l-2 border-[#E2E8F0] pl-2">
                        {item.note}
                      </p>
                    )}
                  </Link>
                </GlassCard>
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
