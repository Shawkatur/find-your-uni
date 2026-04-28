"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  List, Columns, MessageCircle, ChevronDown, Plus, Download,
  Search, X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ─── Status maps ────────────────────────────────────────────────────────────

const NEXT_STATUSES: Record<string, AppStatus[]> = {
  lead:              ["pre_evaluation", "withdrawn"],
  pre_evaluation:    ["docs_collection", "rejected", "withdrawn"],
  docs_collection:   ["applied", "withdrawn"],
  applied:           ["offer_received", "conditional_offer", "rejected", "withdrawn"],
  offer_received:    ["visa_stage", "withdrawn"],
  conditional_offer: ["docs_collection", "offer_received", "rejected", "withdrawn"],
  visa_stage:        ["enrolled", "rejected", "withdrawn"],
  enrolled:          [],
  rejected:          [],
  withdrawn:         [],
};

const STATUS_PILL: Record<string, string> = {
  lead:              "bg-slate-100 text-slate-700",
  pre_evaluation:    "bg-blue-50 text-blue-700",
  docs_collection:   "bg-amber-50 text-amber-700",
  applied:           "bg-indigo-50 text-indigo-700",
  offer_received:    "bg-emerald-50 text-emerald-700",
  conditional_offer: "bg-emerald-50 text-emerald-700",
  visa_stage:        "bg-purple-50 text-purple-700",
  enrolled:          "bg-green-50 text-green-700",
  rejected:          "bg-rose-50 text-rose-700",
  withdrawn:         "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  pre_evaluation: "Pre-Eval",
  docs_collection: "Docs",
  applied: "Applied",
  offer_received: "Offer",
  conditional_offer: "Conditional",
  visa_stage: "Visa",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const ALL_STATUSES: AppStatus[] = [
  "lead", "pre_evaluation", "docs_collection", "applied",
  "offer_received", "conditional_offer", "visa_stage",
  "enrolled", "rejected", "withdrawn",
];

// Bulk-applicable statuses (only common forward moves make sense)
const BULK_STATUSES: AppStatus[] = [
  "pre_evaluation", "docs_collection", "applied",
  "offer_received", "rejected", "withdrawn",
];

// ─── Kanban constants ───────────────────────────────────────────────────────

const KANBAN_COLUMNS: AppStatus[] = [
  "lead", "pre_evaluation", "docs_collection", "applied",
  "offer_received", "visa_stage", "enrolled", "rejected",
];

const COLUMN_LABELS: Record<string, string> = {
  lead:            "Leads",
  pre_evaluation:  "Pre-Evaluation",
  docs_collection: "Docs Collection",
  applied:         "Applied",
  offer_received:  "Offer Received",
  visa_stage:      "Visa Stage",
  enrolled:        "Enrolled",
  rejected:        "Rejected / Withdrawn",
};

const COLUMN_HEADER_COLORS: Record<string, string> = {
  lead:            "text-slate-600 bg-slate-50 border-slate-200",
  pre_evaluation:  "text-blue-600 bg-blue-50 border-blue-200",
  docs_collection: "text-amber-600 bg-amber-50 border-amber-200",
  applied:         "text-indigo-600 bg-indigo-50 border-indigo-200",
  offer_received:  "text-emerald-600 bg-emerald-50 border-emerald-200",
  visa_stage:      "text-purple-600 bg-purple-50 border-purple-200",
  enrolled:        "text-green-600 bg-green-50 border-green-200",
  rejected:        "text-red-600 bg-red-50 border-red-200",
};

const COLUMN_BG: Record<string, string> = {
  lead:            "bg-slate-50 border-slate-200",
  pre_evaluation:  "bg-slate-50 border-blue-200",
  docs_collection: "bg-slate-50 border-amber-200",
  applied:         "bg-slate-50 border-indigo-200",
  offer_received:  "bg-slate-50 border-emerald-200",
  visa_stage:      "bg-slate-50 border-purple-200",
  enrolled:        "bg-slate-50 border-green-200",
  rejected:        "bg-slate-50 border-red-200",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function isBlankUni(val: string | undefined | null): boolean {
  return !val || val.trim() === "" || val.trim() === ".";
}

// ─── Kanban Card (unchanged) ────────────────────────────────────────────────

function ApplicationCard({ app, onStatusChange }: {
  app: Application;
  onStatusChange: (id: string, status: AppStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const next = NEXT_STATUSES[app.status] ?? [];
  const whatsapp = app.student?.phone
    ? `https://wa.me/${app.student.phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="glass-card p-4 mb-2 glass-card-hover">
      <Link href={`/consultant/applications/${app.id}`} className="block mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#1E293B] font-black tracking-tight text-sm">{app.student?.full_name ?? "Student"}</span>
          {app.assigned_source === "admin" && (
            <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-violet-700 shrink-0">
              Admin
            </span>
          )}
        </div>
        <div className="text-[#64748B] text-xs font-medium mt-0.5">{app.university?.name}</div>
        <div className="text-[#64748B] text-xs">{app.program?.name}</div>
      </Link>

      <div className="flex items-center gap-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <button className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <MessageCircle size={13} />
            </button>
          </a>
        )}

        {next.length > 0 && (
          <div className="relative flex-1">
            <button
              onClick={() => setOpen(!open)}
              className="w-full text-xs text-[#64748B] hover:text-[#1E293B] flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500/30 bg-white transition-colors"
            >
              Move to... <ChevronDown size={11} />
            </button>
            {open && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl shadow-black/10">
                {next.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(app.id, s); setOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-xs text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B] transition-colors font-medium capitalize"
                  >
                    → {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ConsultantApplicationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["consultant-applications-all"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=100");
      return (res.data || []).map((app: Record<string, unknown>) => ({
        ...app,
        student: app.students ?? app.student,
        program: app.programs ?? app.program,
        university: (app.programs as Record<string, unknown>)?.universities ?? app.university,
      }));
    },
  });

  // Unique universities for filter
  const universities = useMemo(() => {
    const names = new Set<string>();
    applications.forEach((a) => {
      if (a.university?.name && !isBlankUni(a.university.name)) names.add(a.university.name);
    });
    return [...names].sort();
  }, [applications]);

  // Filter logic
  const filtered = useMemo(() => {
    let list = applications;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.student?.full_name?.toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (universityFilter) {
      list = list.filter((a) => a.university?.name === universityFilter);
    }
    if (sourceFilter) {
      if (sourceFilter === "admin") {
        list = list.filter((a) => a.assigned_source === "admin");
      } else if (sourceFilter === "self") {
        list = list.filter((a) => !a.assigned_source || a.assigned_source !== "admin");
      }
    }
    return list;
  }, [applications, searchQuery, statusFilter, universityFilter, sourceFilter]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppStatus }) => {
      await api.patch(`/applications/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["consultant-applications-all"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleStatusChange = (id: string, status: AppStatus) => {
    updateStatus.mutate({ id, status });
  };

  async function handleBulkStatusChange(status: AppStatus) {
    const appIds = filtered
      .filter((a) => selectedStudentIds.has(a.student_id))
      .map((a) => a.id);
    let successes = 0;
    for (const id of appIds) {
      try {
        await api.patch(`/applications/${id}/status`, { status });
        successes++;
      } catch { /* skip invalid transitions */ }
    }
    if (successes > 0) {
      toast.success(`Updated ${successes} application${successes !== 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["consultant-applications-all"] });
      setSelectedStudentIds(new Set());
    } else {
      toast.error("No applications could be updated (invalid transitions)");
    }
  }

  function toggleStudentSelection(studentId: string, checked: boolean) {
    const next = new Set(selectedStudentIds);
    if (checked) next.add(studentId);
    else next.delete(studentId);
    setSelectedStudentIds(next);
  }

  const uniqueStudentIds = [...new Set(filtered.map((a) => a.student_id))];

  function toggleAllStudents(checked: boolean) {
    if (checked) {
      const next = new Set(selectedStudentIds);
      for (const sid of uniqueStudentIds) next.add(sid);
      setSelectedStudentIds(next);
    } else {
      const pageIds = new Set(uniqueStudentIds);
      const next = new Set([...selectedStudentIds].filter((id) => !pageIds.has(id)));
      setSelectedStudentIds(next);
    }
  }

  const allStudentsSelected = uniqueStudentIds.length > 0 && uniqueStudentIds.every((sid) => selectedStudentIds.has(sid));

  async function handleDownloadDossiers() {
    setDownloading(true);
    try {
      const res = await api.post("/dossier/consultant", { student_ids: Array.from(selectedStudentIds) }, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_dossiers.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSelectedStudentIds(new Set());
      toast.success("Dossier downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download dossiers");
    }
    setDownloading(false);
  }

  const hasActiveFilters = searchQuery || statusFilter || universityFilter || sourceFilter;

  return (
    <PageWrapper
      title="Applications"
      subtitle={`${applications.length} total applications`}
      actions={
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setView("list")}
            className={`px-3.5 py-2 flex items-center gap-1.5 text-sm font-semibold transition-colors ${view === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`px-3.5 py-2 flex items-center gap-1.5 text-sm font-semibold transition-colors ${view === "kanban" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
          >
            <Columns size={14} /> Kanban
          </button>
        </div>
      }
    >
      {/* ─── CRM Action Bar ─────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
            ))}
          </select>

          {/* University filter */}
          <select
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            <option value="">All Universities</option>
            {universities.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            <option value="">All Sources</option>
            <option value="admin">Admin Assigned</option>
            <option value="self">Self-Sourced</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter(""); setUniversityFilter(""); setSourceFilter(""); }}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ─── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        /* Skeleton loading */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-3 w-16" />
            <div className="flex-1" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Columns}
          title="No applications yet"
          description="Once students start applying, their applications will appear here."
          action={{
            label: "Add First Student",
            onClick: () => router.push("/student/register"),
          }}
          className="py-24"
        />
      ) : view === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50/50">
            <input
              type="checkbox"
              checked={allStudentsSelected}
              onChange={(e) => toggleAllStudents(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-emerald-600"
            />
            <span className="w-8" />
            <span className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Student</span>
            <span className="w-48 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:block">University / Program</span>
            <span className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-right hidden sm:block">Date</span>
            <span className="w-28 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Status</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-slate-400 text-sm">No applications match your filters.</p>
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter(""); setUniversityFilter(""); setSourceFilter(""); }}
                className="text-emerald-600 text-sm font-medium mt-2 hover:text-emerald-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((app) => {
              const next = NEXT_STATUSES[app.status] ?? [];
              const isTerminal = next.length === 0;

              return (
                <div
                  key={app.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.has(app.student_id)}
                    onChange={(e) => toggleStudentSelection(app.student_id, e.target.checked)}
                    className="w-4 h-4 shrink-0 rounded border-slate-300 accent-emerald-600"
                  />

                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(app.student?.full_name)}
                  </div>

                  {/* Name */}
                  <Link href={`/consultant/applications/${app.id}`} className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                      {app.student?.full_name ?? "Student"}
                      {app.assigned_source === "admin" && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 shrink-0">
                          Admin Assigned
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 truncate md:hidden">
                      {isBlankUni(app.university?.name)
                        ? <span className="text-slate-400 italic">Pending university selection</span>
                        : <>{app.university?.name}{app.program?.name && !isBlankUni(app.program.name) ? ` · ${app.program.name}` : ""}</>
                      }
                    </div>
                  </Link>

                  {/* University / Program (desktop) */}
                  <div className="w-48 hidden md:block">
                    <Link href={`/consultant/applications/${app.id}`} className="block truncate">
                      {isBlankUni(app.university?.name)
                        ? <span className="text-slate-400 italic text-xs">Pending university selection</span>
                        : (
                          <div className="text-xs text-slate-600 truncate">
                            {app.university?.name}{app.program?.name && !isBlankUni(app.program.name) ? ` · ${app.program.name}` : ""}
                          </div>
                        )
                      }
                    </Link>
                  </div>

                  {/* Date */}
                  <div className="w-24 text-right hidden sm:block">
                    <span className="text-xs text-slate-500">
                      {new Date(app.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status pill / inline edit */}
                  <div className="w-28 flex justify-end shrink-0">
                    {isTerminal ? (
                      <span className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${STATUS_PILL[app.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {STATUS_LABEL[app.status] ?? app.status}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition-all ${STATUS_PILL[app.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {STATUS_LABEL[app.status] ?? app.status} <ChevronDown size={10} className="inline ml-0.5 -mt-px" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                          {next.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(app.id, s)}
                              className="text-xs capitalize"
                            >
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_PILL[s]?.split(" ")[0] ?? "bg-slate-100"}`} />
                              {s.replace(/_/g, " ")}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ─── Kanban View (unchanged) ──────────────────────────────────── */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const col = applications.filter((a) =>
              status === "rejected"
                ? ["rejected", "withdrawn"].includes(a.status)
                : status === "offer_received"
                ? ["offer_received", "conditional_offer"].includes(a.status)
                : a.status === status
            );
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-72 rounded-2xl border backdrop-blur-sm p-4 ${COLUMN_BG[status]}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest ${COLUMN_HEADER_COLORS[status]}`}>
                    {COLUMN_LABELS[status]}
                  </div>
                  <span className="text-xs text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                    {col.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {col.map((app) => (
                    <ApplicationCard key={app.id} app={app} onStatusChange={handleStatusChange} />
                  ))}
                  {col.length === 0 && (
                    <div className="glass-card-dashed flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Plus size={20} className="text-slate-600 mb-2" />
                      <p className="text-slate-600 text-xs font-medium">No applications here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Floating Bulk Action Bar ───────────────────────────────────── */}
      {selectedStudentIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? "s" : ""} selected
          </span>

          {selectedStudentIds.size > 10 && (
            <span className="text-xs text-rose-400 font-medium">Max 10 for download</span>
          )}

          {/* Bulk status update */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 transition-colors">
              Bulk Update Status <ChevronDown size={11} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="min-w-[160px]">
              {BULK_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleBulkStatusChange(s)}
                  className="text-xs capitalize"
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_PILL[s]?.split(" ")[0] ?? "bg-slate-100"}`} />
                  {s.replace(/_/g, " ")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            disabled={downloading || selectedStudentIds.size > 10 || selectedStudentIds.size === 0}
            onClick={handleDownloadDossiers}
            className="text-xs"
          >
            <Download size={13} className="mr-1.5" />
            {downloading ? "Compiling..." : "Download Dossiers"}
          </Button>

          <button
            onClick={() => setSelectedStudentIds(new Set())}
            className="text-xs text-slate-400 hover:text-white transition-colors ml-1"
          >
            Clear
          </button>
        </div>
      )}
    </PageWrapper>
  );
}
