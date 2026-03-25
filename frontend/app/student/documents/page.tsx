"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, Circle, Trash2, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Document, DocType } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DOC_TYPES: { value: DocType; label: string; required: boolean }[] = [
  { value: "passport",    label: "Passport",                required: true  },
  { value: "transcript",  label: "Transcript",              required: true  },
  { value: "sop",         label: "Statement of Purpose",    required: true  },
  { value: "lor",         label: "Letter of Recommendation",required: true  },
  { value: "cv",          label: "CV / Resume",             required: true  },
  { value: "ielts",       label: "IELTS Certificate",       required: false },
  { value: "toefl",       label: "TOEFL Certificate",       required: false },
  { value: "gre",         label: "GRE Score Report",        required: false },
  { value: "gmat",        label: "GMAT Score Report",       required: false },
  { value: "other",       label: "Other",                   required: false },
];

export default function DocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocType>("transcript");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["student-documents"],
    queryFn: async () => {
      const res = await api.get("/documents");
      return res.data?.items ?? res.data ?? [];
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);

      await api.post("/documents/upload", formData);
      toast.success("Document uploaded!");
      qc.invalidateQueries({ queryKey: ["student-documents"] });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Upload failed. Try again.";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      toast.success("Document deleted.");
      qc.invalidateQueries({ queryKey: ["student-documents"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete document."),
  });

  // Build a map of uploaded doc types -> document
  const uploadedMap = new Map<DocType, Document[]>();
  for (const doc of documents) {
    const existing = uploadedMap.get(doc.doc_type) ?? [];
    uploadedMap.set(doc.doc_type, [...existing, doc]);
  }

  const uploadedCount = DOC_TYPES.filter((t) => uploadedMap.has(t.value)).length;
  const requiredCount = DOC_TYPES.filter((t) => t.required).length;
  const requiredUploaded = DOC_TYPES.filter((t) => t.required && uploadedMap.has(t.value)).length;
  const progressPct = Math.round((uploadedCount / DOC_TYPES.length) * 100);

  return (
    <PageWrapper title="Documents" subtitle="Your docs, sorted.">
      {/* Document Readiness Header */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <Shield size={18} className="text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-[#333] font-black tracking-tight">Doc Readiness</h2>
              <p className="text-[#64748B] text-xs font-medium mt-0.5">
                {requiredUploaded}/{requiredCount} required docs uploaded
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#333] tracking-tight">{uploadedCount}</div>
            <div className="text-[#64748B] text-xs">/ {DOC_TYPES.length} docs</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progressPct === 100
                ? "bg-gradient-to-r from-[#10B981] to-[#34D399]"
                : progressPct >= 50
                ? "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
                : "bg-gradient-to-r from-[#3B82F6] to-[#93C5FD]"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#94A3B8] font-medium">
          <span>0%</span>
          <span className={progressPct >= 100 ? "text-[#10B981] font-bold" : "text-[#64748B]"}>
            {progressPct}% complete
          </span>
          <span>100%</span>
        </div>
      </GlassCard>

      {/* Document Checklist Grid */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {DOC_TYPES.map((docTypeItem) => {
          const uploaded = uploadedMap.get(docTypeItem.value) ?? [];
          const isDone = uploaded.length > 0;

          return (
            <div
              key={docTypeItem.value}
              className={`relative rounded-2xl border p-4 transition-all duration-200 ${
                isDone
                  ? "bg-[rgba(16,185,129,0.03)] border-[rgba(16,185,129,0.15)]"
                  : "bg-[#FAFBFC] border-[#E2E8F0] border-dashed"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-[#10B981]" />
                  ) : (
                    <Circle size={18} className="text-[#94A3B8]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tracking-tight ${isDone ? "text-[#333]" : "text-[#64748B]"}`}>
                      {docTypeItem.label}
                    </span>
                    {docTypeItem.required && !isDone && (
                      <span className="tag-pill tag-pill-red text-[8px]">Required</span>
                    )}
                    {isDone && (
                      <span className="tag-pill tag-pill-green text-[8px]">Uploaded</span>
                    )}
                  </div>

                  {isDone && (
                    <div className="mt-1.5 space-y-1">
                      {uploaded.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2">
                          <span className="text-[#059669] text-xs truncate">{doc.filename}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="text-[#10B981] hover:text-[#059669]">
                                <ExternalLink size={11} />
                              </a>
                            )}
                            <button
                              onClick={() => setDeleteId(doc.id)}
                              className="text-[#94A3B8] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => {
                        setDocType(docTypeItem.value);
                        setTimeout(() => fileRef.current?.click(), 50);
                      }}
                      className="mt-1.5 text-xs text-[#64748B] hover:text-[#10B981] transition-colors font-medium flex items-center gap-1"
                    >
                      <Upload size={10} /> Add file
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] flex items-center justify-center">
            <Upload size={13} className="text-[#3B82F6]" />
          </div>
          <h2 className="text-[#333] font-black tracking-tight">Upload Document</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="bg-white border border-[#CBD5E1] text-[#333] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#10B981] flex-1 cursor-pointer"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />

          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0">
            {uploading ? (
              <><LoadingSpinner size="sm" className="mr-2" /> Uploading...</>
            ) : (
              <><Upload size={14} className="mr-2" /> Choose File</>
            )}
          </Button>
        </div>
        <p className="text-[#94A3B8] text-xs mt-2">PDF, DOC, DOCX, JPG, PNG · max 10MB</p>
      </GlassCard>

      {isLoading && <LoadingSpinner size="lg" className="py-10" />}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Document"
        description="This will permanently delete the document. Can't undo this."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </PageWrapper>
  );
}
