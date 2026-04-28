"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Search, X, ChevronDown, MessageCircle, Users, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ─── Pipeline stages ──────────────────────────────────────────────────────────

type PipelineStatus = "invited" | "onboarding" | "gathering_docs" | "ready_to_apply" | "applied" | "enrolled";

const PIPELINE_STAGES: PipelineStatus[] = [
  "invited", "onboarding", "gathering_docs", "ready_to_apply", "applied", "enrolled",
];

const PIPELINE_LABEL: Record<PipelineStatus, string> = {
  invited: "Invited",
  onboarding: "Onboarding",
  gathering_docs: "Gathering Docs",
  ready_to_apply: "Ready to Apply",
  applied: "Applied",
  enrolled: "Enrolled",
};

const PIPELINE_STYLE: Record<PipelineStatus, string> = {
  invited: "bg-slate-100 text-slate-700 border-slate-200",
  onboarding: "bg-blue-50 text-blue-700 border-blue-200",
  gathering_docs: "bg-amber-50 text-amber-700 border-amber-200",
  ready_to_apply: "bg-indigo-50 text-indigo-700 border-indigo-200",
  applied: "bg-purple-50 text-purple-700 border-purple-200",
  enrolled: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PIPELINE_DOT: Record<PipelineStatus, string> = {
  invited: "bg-slate-400",
  onboarding: "bg-blue-500",
  gathering_docs: "bg-amber-500",
  ready_to_apply: "bg-indigo-500",
  applied: "bg-purple-500",
  enrolled: "bg-emerald-500",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RosterStudent {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  pipeline_status: PipelineStatus;
  preferred_countries?: string[];
  preferred_degree?: string;
  assigned_source?: string | null;
  has_rejected_docs?: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultantStudentsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const { data: students = [], isLoading } = useQuery<RosterStudent[]>({
    queryKey: ["consultant-my-students"],
    queryFn: async () => {
      const res = await api.get("/consultants/me/students");
      return res.data || [];
    },
  });

  const updatePipeline = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: PipelineStatus }) => {
      await api.patch(`/consultants/me/students/${studentId}/pipeline`, { pipeline_status: status });
    },
    onSuccess: () => {
      toast.success("Pipeline status updated");
      qc.invalidateQueries({ queryKey: ["consultant-my-students"] });
    },
    onError: () => toast.error("Failed to update pipeline status"),
  });

  const filtered = useMemo(() => {
    let list = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q)
      );
    }
    if (stageFilter) {
      list = list.filter((s) => s.pipeline_status === stageFilter);
    }
    if (sourceFilter) {
      list = list.filter((s) => s.assigned_source === sourceFilter);
    }
    return list;
  }, [students, searchQuery, stageFilter, sourceFilter]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of students) {
      counts[s.pipeline_status] = (counts[s.pipeline_status] || 0) + 1;
    }
    return counts;
  }, [students]);

  const hasActiveFilters = searchQuery || stageFilter || sourceFilter;

  return (
    <PageWrapper
      title="My Students"
      subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} in your roster`}
    >
      {/* ─── Pipeline Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {PIPELINE_STAGES.map((stage) => {
          const count = stageCounts[stage] || 0;
          const isActive = stageFilter === stage;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(isActive ? "" : stage)}
              className={`rounded-xl border p-3 text-center transition-all ${
                isActive
                  ? `${PIPELINE_STYLE[stage]} ring-2 ring-offset-1 ring-current`
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`text-2xl font-bold tracking-tight ${isActive ? "" : "text-slate-900"}`}>
                {count}
              </div>
              <div className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${isActive ? "" : "text-slate-500"}`}>
                {PIPELINE_LABEL[stage]}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
        >
          <option value="">All Stages</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>{PIPELINE_LABEL[s]}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
        >
          <option value="">All Sources</option>
          <option value="tracking_link">Tracking Link</option>
          <option value="admin">Admin Assigned</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(""); setStageFilter(""); setSourceFilter(""); }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ─── Data Table ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
            <Skeleton className="h-3 w-16" />
            <div className="flex-1" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Students will appear here once they register through your invite link or are assigned to you by an admin."
          className="py-24"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50/50">
            <span className="w-8" />
            <span className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Student</span>
            <span className="w-32 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:block">Contact</span>
            <span className="w-36 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Pipeline Stage</span>
            <span className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-right hidden sm:block">Joined</span>
            <span className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Manage</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-slate-400 text-sm">No students match your filters.</p>
              <button
                onClick={() => { setSearchQuery(""); setStageFilter(""); setSourceFilter(""); }}
                className="text-emerald-600 text-sm font-medium mt-2 hover:text-emerald-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((student) => {
              const whatsapp = student.phone
                ? `https://wa.me/${student.phone.replace(/\D/g, "")}`
                : null;

              return (
                <div
                  key={student.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(student.full_name)}
                  </div>

                  {/* Name + badges + rejected docs warning */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                      {student.full_name}
                      {student.has_rejected_docs && (
                        <span className="relative group shrink-0">
                          <AlertCircle size={14} className="text-rose-500" />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[10px] font-medium text-white bg-slate-900 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-20">
                            Action required: Rejected documents
                            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
                          </span>
                        </span>
                      )}
                      {student.assigned_source === "admin" && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 shrink-0">
                          Admin Assigned
                        </span>
                      )}
                      {student.assigned_source === "tracking_link" && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700 shrink-0">
                          Tracking Link
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate md:hidden">
                      {student.phone || student.email || "No contact"}
                    </div>
                  </div>

                  {/* Contact (desktop) */}
                  <div className="w-32 hidden md:block">
                    <div className="text-xs text-slate-600 truncate">{student.phone || "—"}</div>
                    {student.email && (
                      <div className="text-xs text-slate-400 truncate">{student.email}</div>
                    )}
                  </div>

                  {/* Pipeline badge with dropdown */}
                  <div className="w-36 flex justify-center shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 cursor-pointer border hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition-all flex items-center gap-1 ${PIPELINE_STYLE[student.pipeline_status]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${PIPELINE_DOT[student.pipeline_status]}`} />
                        {PIPELINE_LABEL[student.pipeline_status]}
                        <ChevronDown size={10} className="ml-0.5 -mt-px" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="min-w-[180px]">
                        {PIPELINE_STAGES.map((stage) => (
                          <DropdownMenuItem
                            key={stage}
                            disabled={stage === student.pipeline_status}
                            onClick={() => updatePipeline.mutate({ studentId: student.id, status: stage })}
                            className="text-xs"
                          >
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${PIPELINE_DOT[stage]}`} />
                            {PIPELINE_LABEL[stage]}
                            {stage === student.pipeline_status && (
                              <span className="ml-auto text-slate-400">Current</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Joined date */}
                  <div className="w-24 text-right hidden sm:block">
                    <span className="text-xs text-slate-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Manage actions */}
                  <div className="w-24 flex justify-end gap-1.5 shrink-0">
                    {whatsapp && (
                      <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                        <button className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 hover:bg-emerald-500/20 transition-colors" title="WhatsApp">
                          <MessageCircle size={13} />
                        </button>
                      </a>
                    )}
                    {student.has_rejected_docs && (
                      <Link href="/consultant/documents">
                        <button className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 hover:bg-rose-500/20 transition-colors" title="Review Rejected Documents">
                          <AlertCircle size={13} />
                        </button>
                      </Link>
                    )}
                    <Link href={`/consultant/applications?search=${encodeURIComponent(student.full_name)}`}>
                      <button className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 hover:bg-blue-500/20 transition-colors" title="View Applications">
                        <Users size={13} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </PageWrapper>
  );
}
