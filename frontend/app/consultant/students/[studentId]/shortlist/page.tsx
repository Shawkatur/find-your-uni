"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
  Plus,
  Search,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/api";
import { GlassCard } from "@/components/layout/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  } | null;
}

interface UniSearchResult {
  id: string;
  name: string;
  country: string;
  city: string | null;
  ranking_qs: number | null;
}

function ConsultantStudentShortlistContent() {
  const { studentId } = useParams<{ studentId: string }>();
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<ShortlistItem[]>({
    queryKey: ["student-shortlist", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/shortlist`);
      return res.data;
    },
    enabled: !!studentId,
  });

  const { data: searchResults = [] } = useQuery<UniSearchResult[]>({
    queryKey: ["uni-search", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const res = await api.get(`/universities?search=${encodeURIComponent(search)}&page_size=8`);
      return res.data?.items ?? [];
    },
    enabled: search.length >= 2,
  });

  const removeMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await api.delete(`/students/${studentId}/shortlist/${universityId}`);
    },
    onSuccess: () => {
      toast.success("Removed from shortlist");
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: () => toast.error("Failed to remove"),
  });

  const addMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await api.post(`/students/${studentId}/shortlist`, { university_id: universityId });
    },
    onSuccess: () => {
      toast.success("Added to student's shortlist");
      setShowAddModal(false);
      setSearch("");
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.info("Already in shortlist");
      else toast.error("Failed to add");
    },
  });

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar role="consultant" />
      <main className="flex-1 md:ml-64 p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/consultant/applications"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Applications
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bookmark size={20} className="text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Student Shortlist</h1>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={14} className="mr-1.5" /> Add University
            </Button>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {items.length > 0
              ? `${items.length} saved universit${items.length === 1 ? "y" : "ies"}`
              : "No universities saved for this student yet"}
          </p>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Search & Add University</h3>
              <button
                onClick={() => { setShowAddModal(false); setSearch(""); }}
                className="text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search universities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white/8 border-white/10 text-white placeholder:text-slate-500"
                autoFocus
              />
            </div>
            {search.length >= 2 && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((uni) => (
                  <div
                    key={uni.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/4 hover:bg-white/7 transition-colors"
                  >
                    <div>
                      <div className="text-white text-sm font-medium">{uni.name}</div>
                      <div className="text-slate-400 text-xs">
                        {uni.city ? `${uni.city}, ` : ""}
                        {uni.country}
                        {uni.ranking_qs ? ` · QS #${uni.ranking_qs}` : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addMutation.mutate(uni.id)}
                      disabled={addMutation.isPending}
                      className="border-white/10 text-slate-300 hover:bg-blue-600/20 hover:text-blue-400"
                    >
                      <Plus size={13} className="mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {search.length >= 2 && searchResults.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No universities found</p>
            )}
          </GlassCard>
        )}

        {/* Shortlist Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading shortlist..." />
          </div>
        ) : items.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Bookmark size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm mb-4">No universities saved yet</p>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={14} className="mr-1.5" /> Add First University
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((item) => {
              const uni = item.university;
              if (!uni) return null;
              return (
                <GlassCard key={item.id} className="relative group">
                  <button
                    onClick={() => removeMutation.mutate(item.university_id)}
                    disabled={removeMutation.isPending}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:bg-red-600/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from shortlist"
                  >
                    <X size={14} />
                  </button>

                  <Link href={`/universities/${uni.id}`} className="block">
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
                          {uni.name}
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {uni.city ? `${uni.city}, ` : ""}
                          {uni.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {uni.ranking_qs && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10 text-[10px]">
                          <Star size={9} className="mr-1" /> QS #{uni.ranking_qs}
                        </Badge>
                      )}
                      {uni.scholarships_available && (
                        <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 text-[10px]">
                          <BadgeCheck size={9} className="mr-1" />
                          Scholarships
                          {uni.max_scholarship_pct ? ` up to ${uni.max_scholarship_pct}%` : ""}
                        </Badge>
                      )}
                      {item.added_by_role === "consultant" && (
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[10px]">
                          <UserCheck size={9} className="mr-1" /> By Consultant
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/8 pt-3">
                      {uni.tuition_usd_per_year ? (
                        <div className="flex items-center gap-1 text-slate-400">
                          <DollarSign size={11} className="text-slate-500" />
                          ${uni.tuition_usd_per_year.toLocaleString()}/yr
                        </div>
                      ) : <span />}
                      {uni.min_ielts && (
                        <div className="text-slate-400">
                          IELTS: <span className="text-white font-medium">{uni.min_ielts}+</span>
                        </div>
                      )}
                      {uni.min_gpa_percentage && (
                        <div className="text-slate-400">
                          GPA: <span className="text-white font-medium">{uni.min_gpa_percentage}%+</span>
                        </div>
                      )}
                      {uni.acceptance_rate_bd && (
                        <div className="text-green-400">{uni.acceptance_rate_bd}% BD accept</div>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-slate-500 text-xs mt-2 italic border-l-2 border-white/10 pl-2">
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

export default function ConsultantStudentShortlistPage() {
  return (
    <Providers>
      <ConsultantStudentShortlistContent />
    </Providers>
  );
}
