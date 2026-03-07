"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { List, Columns, MessageCircle, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

// Status flow allowed transitions
const NEXT_STATUSES: Record<string, AppStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "rejected", "withdrawn"],
  under_review: ["offer_received", "rejected", "withdrawn"],
  offer_received: ["enrolled", "withdrawn"],
  enrolled: [],
  rejected: [],
  withdrawn: [],
};

const KANBAN_COLUMNS: AppStatus[] = [
  "submitted",
  "under_review",
  "offer_received",
  "enrolled",
  "rejected",
];

const COLUMN_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  offer_received: "Offer Received",
  enrolled: "Enrolled",
  rejected: "Rejected / Withdrawn",
};

const COLUMN_HEADER_COLORS: Record<string, string> = {
  submitted:     "text-blue-400 bg-blue-500/10 border-blue-500/20",
  under_review:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  offer_received:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  enrolled:      "text-green-400 bg-green-500/10 border-green-500/20",
  rejected:      "text-red-400 bg-red-500/10 border-red-500/20",
};

const COLUMN_BG: Record<string, string> = {
  submitted:     "bg-slate-800/30 border-blue-500/15",
  under_review:  "bg-slate-800/30 border-yellow-500/15",
  offer_received:"bg-slate-800/30 border-emerald-500/15",
  enrolled:      "bg-slate-800/30 border-green-500/15",
  rejected:      "bg-slate-800/30 border-red-500/15",
};

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
        <div className="text-white font-black tracking-tight text-sm">{app.student?.full_name ?? "Student"}</div>
        <div className="text-slate-400 text-xs font-medium mt-0.5">{app.university?.name}</div>
        <div className="text-slate-500 text-xs">{app.program?.name}</div>
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
              className="w-full text-xs text-slate-400 hover:text-white flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 bg-slate-900/40 transition-colors"
            >
              Move to... <ChevronDown size={11} />
            </button>
            {open && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-slate-800 border border-white/15 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
                {next.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(app.id, s); setOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-white/8 hover:text-white transition-colors font-medium capitalize"
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

export default function ConsultantApplicationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data, isLoading } = useQuery<{ items: Application[] }>({
    queryKey: ["consultant-applications-all"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=100");
      return res.data;
    },
  });

  const applications = data?.items ?? [];

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

  return (
    <PageWrapper
      title="Applications"
      subtitle={`${applications.length} total applications`}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
            <button
              onClick={() => setView("list")}
              className={`px-3.5 py-2 flex items-center gap-1.5 text-sm font-semibold transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/8"}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`px-3.5 py-2 flex items-center gap-1.5 text-sm font-semibold transition-colors ${view === "kanban" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/8"}`}
            >
              <Columns size={14} /> Kanban
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Columns}
          title="No applications yet"
          description="Once students start applying, their applications will appear here. Add your first student to get started."
          action={{
            label: "Add First Student",
            onClick: () => router.push("/student/register"),
          }}
          className="py-24"
        />
      ) : view === "list" ? (
        <div className="space-y-2">
          {applications.map((app) => (
            <GlassCard key={app.id} hover padding={false} className="p-4">
              <div className="flex items-center justify-between">
                <Link href={`/consultant/applications/${app.id}`} className="flex-1 min-w-0">
                  <div className="text-white font-black tracking-tight text-sm">{app.student?.full_name ?? "Student"}</div>
                  <div className="text-slate-400 text-xs font-medium">{app.university?.name} · {app.program?.name}</div>
                  <div className="text-slate-600 text-xs">{new Date(app.updated_at).toLocaleDateString()}</div>
                </Link>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <StatusBadge status={app.status} />
                  {NEXT_STATUSES[app.status]?.length > 0 && (
                    <div className="relative group">
                      <Button size="sm" variant="outline">
                        Update <ChevronDown size={11} className="ml-1" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:block bg-slate-800 border border-white/15 rounded-xl overflow-hidden shadow-2xl shadow-black/40 min-w-[160px]">
                        {NEXT_STATUSES[app.status].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(app.id, s)}
                            className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-white/8 hover:text-white transition-colors font-medium capitalize"
                          >
                            → {s.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        /* Kanban */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const col = applications.filter((a) =>
              status === "rejected" ? ["rejected", "withdrawn"].includes(a.status) : a.status === status
            );
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-72 rounded-2xl border backdrop-blur-sm p-4 ${COLUMN_BG[status]}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest ${COLUMN_HEADER_COLORS[status]}`}>
                    {COLUMN_LABELS[status]}
                  </div>
                  <span className="text-xs text-slate-500 bg-white/8 px-2 py-0.5 rounded-full font-bold">
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
    </PageWrapper>
  );
}
