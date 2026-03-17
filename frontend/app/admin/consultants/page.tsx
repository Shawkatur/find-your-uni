"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users2,
  CheckCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";
import api from "@/lib/api";
import type { ConsultantWithStatus, PaginatedResponse } from "@/types";

type StatusFilter = "all" | "pending" | "active" | "banned";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "banned", label: "Banned" },
];

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  pending: { cls: "tag-pill bg-amber-500/15 text-amber-300 border-amber-500/25", label: "Pending" },
  active:  { cls: "tag-pill bg-green-500/15 text-green-300 border-green-500/25",  label: "Active" },
  banned:  { cls: "tag-pill bg-red-500/15 text-red-300 border-red-500/25",       label: "Banned" },
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmBanDialog({
  consultant,
  onConfirm,
  onClose,
}: {
  consultant: ConsultantWithStatus;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/25">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Ban Consultant?</h3>
            <p className="text-slate-400 text-xs">This action can be reversed.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-5">
          <span className="font-semibold text-white">{consultant.full_name}</span> will
          lose access to their consultant dashboard immediately.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Ban
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminConsultantsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState<ConsultantWithStatus | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<ConsultantWithStatus>>({
    queryKey: ["admin-consultants", statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api.get(`/admin/consultants?${params}`).then((r) => r.data);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/consultants/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-consultants"] });
      setBanTarget(null);
    },
  });

  const consultants = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-blue-600/15 flex items-center justify-center border border-blue-500/25">
          <Users2 size={18} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Consultants</h1>
          <p className="text-slate-400 text-sm">{total} total</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={
              statusFilter === tab.key
                ? "px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold"
                : "px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs font-semibold hover:text-white hover:bg-white/5 transition-colors"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Agency</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 py-12 text-sm">Loading…</td>
              </tr>
            )}
            {!isLoading && consultants.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Users2 size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No consultants found</p>
                </td>
              </tr>
            )}
            {consultants.map((c) => {
              const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.pending;
              return (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden sm:table-cell">
                    {(c.agencies as { name?: string } | undefined)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`tag-pill text-xs border ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {c.status !== "active" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: c.id, status: "active" })}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600/15 border border-green-500/25 text-green-300 text-xs font-semibold hover:bg-green-600/25 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          Approve
                        </button>
                      )}
                      {c.status !== "banned" && (
                        <button
                          onClick={() => setBanTarget(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/15 border border-red-500/25 text-red-300 text-xs font-semibold hover:bg-red-600/25 transition-colors"
                        >
                          <Ban size={12} />
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <span className="text-slate-500 text-xs">Page {page} of {totalPages}</span>
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

      {banTarget && (
        <ConfirmBanDialog
          consultant={banTarget}
          onConfirm={() => updateStatus.mutate({ id: banTarget.id, status: "banned" })}
          onClose={() => setBanTarget(null)}
        />
      )}
    </div>
  );
}
