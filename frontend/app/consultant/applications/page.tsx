"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { List, Columns, MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

const COLUMN_COLORS: Record<string, string> = {
  submitted: "border-blue-500/30 bg-blue-600/5",
  under_review: "border-yellow-500/30 bg-yellow-600/5",
  offer_received: "border-green-500/30 bg-green-600/5",
  enrolled: "border-emerald-500/30 bg-emerald-600/5",
  rejected: "border-red-500/30 bg-red-600/5",
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
    <div className="glass-card p-4 mb-2">
      <Link href={`/consultant/applications/${app.id}`} className="block mb-3">
        <div className="text-white font-medium text-sm">{app.student?.full_name ?? "Student"}</div>
        <div className="text-slate-400 text-xs">{app.university?.name}</div>
        <div className="text-slate-500 text-xs">{app.program?.name}</div>
      </Link>

      <div className="flex items-center gap-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10 p-1.5 h-auto">
              <MessageCircle size={13} />
            </Button>
          </a>
        )}

        {next.length > 0 && (
          <div className="relative flex-1">
            <button
              onClick={() => setOpen(!open)}
              className="w-full text-xs text-slate-400 hover:text-white flex items-center justify-between px-2 py-1 rounded border border-white/10 hover:border-blue-500/30 transition-colors"
            >
              Move to... <ChevronDown size={12} />
            </button>
            {open && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-slate-800 border border-white/10 rounded-lg overflow-hidden shadow-xl">
                {next.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(app.id, s); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/8 transition-colors capitalize"
                  >
                    {s.replace(/_/g, " ")}
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
        <div className="flex border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/8"}`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${view === "kanban" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/8"}`}
          >
            <Columns size={14} /> Kanban
          </button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : view === "list" ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <GlassCard key={app.id} hover padding={false} className="p-5">
              <div className="flex items-center justify-between">
                <Link href={`/consultant/applications/${app.id}`} className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm">{app.student?.full_name ?? "Student"}</div>
                  <div className="text-slate-400 text-xs">{app.university?.name} · {app.program?.name}</div>
                  <div className="text-slate-500 text-xs">{new Date(app.updated_at).toLocaleDateString()}</div>
                </Link>
                <div className="flex items-center gap-3 ml-4">
                  <StatusBadge status={app.status} />
                  {NEXT_STATUSES[app.status]?.length > 0 && (
                    <div className="relative group">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-300 hover:bg-white/8 text-xs"
                      >
                        Update <ChevronDown size={12} className="ml-1" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:block bg-slate-800 border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[160px]">
                        {NEXT_STATUSES[app.status].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(app.id, s)}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/8 transition-colors capitalize"
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
                className={`flex-shrink-0 w-72 rounded-xl border p-4 ${COLUMN_COLORS[status]}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">{COLUMN_LABELS[status]}</h3>
                  <span className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((app) => (
                    <ApplicationCard key={app.id} app={app} onStatusChange={handleStatusChange} />
                  ))}
                  {col.length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-xs">No applications</div>
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
