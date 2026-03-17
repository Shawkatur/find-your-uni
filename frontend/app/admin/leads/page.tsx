"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, UserCheck, ChevronLeft, ChevronRight, X } from "lucide-react";
import api from "@/lib/api";
import type { LeadApplication, ConsultantWithStatus, PaginatedResponse } from "@/types";

// ─── Assign Dialog ─────────────────────────────────────────────────────────────

function AssignDialog({
  lead,
  onClose,
}: {
  lead: LeadApplication;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [note, setNote] = useState("");

  const { data: consultants } = useQuery<PaginatedResponse<ConsultantWithStatus>>({
    queryKey: ["admin-active-consultants"],
    queryFn: () =>
      api.get("/admin/consultants?status=active&page_size=100").then((r) => r.data),
  });

  const assign = useMutation({
    mutationFn: () =>
      api.patch(`/admin/leads/${lead.id}/assign`, {
        consultant_id: selectedConsultantId,
        agency_id: selectedAgencyId,
        note: note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      onClose();
    },
  });

  const handleConsultantChange = (id: string) => {
    setSelectedConsultantId(id);
    const c = consultants?.items.find((x) => x.id === id);
    if (c?.agency_id) setSelectedAgencyId(c.agency_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Assign Lead</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">Student</p>
            <p className="text-white font-semibold">
              {lead.students?.full_name ?? "Unknown"}
            </p>
            {lead.students?.phone && (
              <p className="text-slate-400 text-xs">{lead.students.phone}</p>
            )}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Assign to Consultant</label>
            <select
              value={selectedConsultantId}
              onChange={(e) => handleConsultantChange(e.target.value)}
              className="w-full bg-white/8 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select consultant…</option>
              {consultants?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — {(c.agencies as { name?: string } | undefined)?.name ?? "No agency"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Handover note…"
              className="w-full bg-white/8 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => assign.mutate()}
            disabled={!selectedConsultantId || assign.isPending}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {assign.isPending ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminLeadsPage() {
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<LeadApplication | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<LeadApplication>>({
    queryKey: ["admin-leads", page],
    queryFn: () => api.get(`/admin/leads?page=${page}`).then((r) => r.data),
  });

  const leads = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
          <Inbox size={18} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Unassigned Leads</h1>
          <p className="text-slate-400 text-sm">{total} lead{total !== 1 ? "s" : ""} awaiting assignment</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Student</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Phone</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Registered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 py-12 text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && leads.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Inbox size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No unassigned leads</p>
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 text-white text-sm font-medium">
                  {lead.students?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {lead.students?.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {lead.students?.created_at
                    ? new Date(lead.students.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setAssignTarget(lead)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-300 text-xs font-semibold hover:bg-blue-600/25 transition-colors"
                  >
                    <UserCheck size={13} />
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <span className="text-slate-500 text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {assignTarget && (
        <AssignDialog lead={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
    </div>
  );
}
