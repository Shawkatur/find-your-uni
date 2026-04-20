"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Inbox,
} from "lucide-react";
import adminApi from "@/lib/admin-api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PendingConsultant {
  id: string;
  full_name: string;
  phone: string | null;
  role_title: string | null;
  created_at: string;
  agencies: { name: string } | null;
  user_id: string;
}

export default function VerificationsPage() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<PendingConsultant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pending-consultants"],
    queryFn: async () => {
      const res = await adminApi.get("/admin/consultants", {
        params: { status: "pending", page_size: 100 },
      });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      await adminApi.patch(`/admin/consultants/${id}/status`, { status, admin_notes });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["pending-consultants"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });

      if (variables.status === "active") {
        toast.success("Consultant approved. Portal access granted.");
      } else {
        toast.success("Consultant rejected.");
      }
    },
    onError: () => {
      toast.error("Action failed. Please try again.");
    },
    onSettled: () => {
      setApprovingId(null);
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const handleApprove = (consultant: PendingConsultant) => {
    setApprovingId(consultant.id);
    statusMutation.mutate({ id: consultant.id, status: "active" });
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    statusMutation.mutate({
      id: rejectTarget.id,
      status: "rejected",
      admin_notes: rejectReason.trim() || undefined,
    });
  };

  const consultants: PendingConsultant[] = data?.items ?? [];

  return (
    <PageWrapper
      title="Pending Verifications"
      subtitle="Review and approve newly registered consultant accounts."
      actions={
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span className="font-medium">{data?.total ?? 0} pending</span>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : consultants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <Inbox size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All caught up</h3>
          <p className="text-slate-500 text-sm mt-1">No pending verifications at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {consultants.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <User size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{c.full_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  Pending
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2.5 mb-5">
                <InfoRow icon={Mail} label="Email" value={c.user_id} muted />
                {c.phone && <InfoRow icon={Phone} label="Phone" value={c.phone} />}
                <InfoRow icon={Building2} label="Agency" value={c.agencies?.name ?? "Unknown"} />
                {c.role_title && <InfoRow icon={Briefcase} label="Title" value={c.role_title} />}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={() => handleApprove(c)}
                  disabled={statusMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  {approvingId === c.id ? (
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-1.5" />
                  )}
                  Approve & Grant Access
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejectTarget(c)}
                  disabled={statusMutation.isPending}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                >
                  <XCircle size={14} className="mr-1.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Reject Consultant</DialogTitle>
            <DialogDescription className="text-slate-500">
              Reject <span className="font-semibold text-slate-700">{rejectTarget?.full_name}</span> from{" "}
              <span className="font-semibold text-slate-700">{rejectTarget?.agencies?.name ?? "Unknown Agency"}</span>?
              This will deny portal access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label className="text-sm font-semibold text-slate-900">Reason (optional)</Label>
            <Textarea
              placeholder="e.g. Incomplete documentation, unverified agency..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-slate-50 border-slate-300 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setRejectTarget(null); setRejectReason(""); }}
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={statusMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {statusMutation.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <XCircle size={14} className="mr-1.5" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

function InfoRow({ icon: Icon, label, value, muted }: { icon: React.ElementType; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon size={14} className="text-slate-400 shrink-0" />
      <span className="text-slate-500 w-16 shrink-0">{label}</span>
      <span className={muted ? "text-slate-400 text-xs font-mono truncate" : "text-slate-900 font-medium truncate"}>
        {value}
      </span>
    </div>
  );
}
