"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Search, X, CheckCircle, XCircle, ExternalLink,
  ShieldCheck, Clock, FileWarning,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueDocument {
  id: string;
  student_id: string;
  student_name: string;
  doc_type: string;
  filename: string;
  url: string | null;
  uploaded_at: string;
  verification_status: string;
}

// ─── Doc type display ─────────────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<string, string> = {
  passport: "Passport",
  transcript: "Transcript",
  sop: "Statement of Purpose",
  lor: "Letter of Recommendation",
  cv: "CV / Resume",
  ielts_cert: "IELTS Certificate",
  toefl_cert: "TOEFL Certificate",
  ielts: "IELTS Score",
  toefl: "TOEFL Score",
  gre: "GRE Score",
  gmat: "GMAT Score",
  nid: "National ID",
  other: "Other",
};

const DOC_TYPE_ICON_COLOR: Record<string, string> = {
  passport: "bg-blue-50 text-blue-600 border-blue-200",
  transcript: "bg-amber-50 text-amber-600 border-amber-200",
  sop: "bg-purple-50 text-purple-600 border-purple-200",
  lor: "bg-indigo-50 text-indigo-600 border-indigo-200",
  cv: "bg-slate-50 text-slate-600 border-slate-200",
  ielts_cert: "bg-emerald-50 text-emerald-600 border-emerald-200",
  toefl_cert: "bg-emerald-50 text-emerald-600 border-emerald-200",
  ielts: "bg-emerald-50 text-emerald-600 border-emerald-200",
  toefl: "bg-emerald-50 text-emerald-600 border-emerald-200",
  gre: "bg-rose-50 text-rose-600 border-rose-200",
  gmat: "bg-rose-50 text-rose-600 border-rose-200",
  nid: "bg-blue-50 text-blue-600 border-blue-200",
  other: "bg-slate-50 text-slate-600 border-slate-200",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocumentVerificationPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");

  // Rejection dialog state
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: documents = [], isLoading } = useQuery<QueueDocument[]>({
    queryKey: ["doc-verification-queue"],
    queryFn: async () => {
      const res = await api.get("/documents/verification-queue");
      return res.data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ docId, status, reason }: { docId: string; status: string; reason?: string }) => {
      await api.patch(`/documents/${docId}/verify`, { status, reason });
    },
    onSuccess: (_, variables) => {
      const action = variables.status === "verified" ? "verified" : "rejected";
      toast.success(`Document ${action} successfully`);
      qc.invalidateQueries({ queryKey: ["doc-verification-queue"] });
      setRejectDocId(null);
      setRejectionReason("");
    },
    onError: () => toast.error("Failed to update document"),
  });

  const filtered = useMemo(() => {
    let list = documents;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) =>
        d.student_name?.toLowerCase().includes(q) ||
        (DOC_TYPE_LABEL[d.doc_type] || d.doc_type).toLowerCase().includes(q)
      );
    }
    if (docTypeFilter) {
      list = list.filter((d) => d.doc_type === docTypeFilter);
    }
    return list;
  }, [documents, searchQuery, docTypeFilter]);

  const docTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((d) => types.add(d.doc_type));
    return [...types].sort();
  }, [documents]);

  const hasActiveFilters = searchQuery || docTypeFilter;

  function handleVerify(docId: string) {
    verifyMutation.mutate({ docId, status: "verified" });
  }

  function handleRejectSubmit() {
    if (!rejectDocId || !rejectionReason.trim()) return;
    verifyMutation.mutate({ docId: rejectDocId, status: "rejected", reason: rejectionReason.trim() });
  }

  return (
    <PageWrapper
      title="Document Verification"
      subtitle={`${documents.length} document${documents.length !== 1 ? "s" : ""} pending review`}
    >
      {/* ─── Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{documents.length}</div>
            <div className="text-xs text-slate-500">Pending Review</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {new Set(documents.map((d) => d.student_id)).size}
            </div>
            <div className="text-xs text-slate-500">Students</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{docTypes.length}</div>
            <div className="text-xs text-slate-500">Doc Types</div>
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or document type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        <select
          value={docTypeFilter}
          onChange={(e) => setDocTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
        >
          <option value="">All Document Types</option>
          {docTypes.map((t) => (
            <option key={t} value={t}>{DOC_TYPE_LABEL[t] || t}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(""); setDocTypeFilter(""); }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ─── Queue ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-3 w-24 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="All caught up!"
          description="No documents pending review. New uploads from your students will appear here."
          className="py-24"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileWarning size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">No documents match your filters.</p>
          <button
            onClick={() => { setSearchQuery(""); setDocTypeFilter(""); }}
            className="text-emerald-600 text-sm font-medium mt-2 hover:text-emerald-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const iconStyle = DOC_TYPE_ICON_COLOR[doc.doc_type] || DOC_TYPE_ICON_COLOR.other;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${iconStyle}`}>
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {DOC_TYPE_LABEL[doc.doc_type] || doc.doc_type}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {doc.student_name}
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 shrink-0">
                    Pending
                  </span>
                </div>

                {/* Meta */}
                <div className="text-xs text-slate-400 mb-4">
                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleVerify(doc.id)}
                    disabled={verifyMutation.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <CheckCircle size={13} className="mr-1" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRejectDocId(doc.id); setRejectionReason(""); }}
                    disabled={verifyMutation.isPending}
                    className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
                  >
                    <XCircle size={13} className="mr-1" />
                    Reject
                  </Button>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 px-2"
                        title="View Document"
                      >
                        <ExternalLink size={13} />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Rejection Dialog ───────────────────────────────────────── */}
      <Dialog open={!!rejectDocId} onOpenChange={(open) => { if (!open) { setRejectDocId(null); setRejectionReason(""); } }}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Reject Document</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Reason for rejection
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Document is blurry, expired, or wrong type..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none transition-colors"
              autoFocus
            />
            {rejectionReason.trim() === "" && (
              <p className="text-xs text-slate-400 mt-1.5">A reason is required so the student knows what to fix.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectDocId(null); setRejectionReason(""); }}
              className="border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || verifyMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {verifyMutation.isPending ? "Rejecting..." : "Reject Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
