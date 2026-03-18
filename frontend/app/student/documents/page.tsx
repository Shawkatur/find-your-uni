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
      toast.success("Document uploaded successfully!");
      qc.invalidateQueries({ queryKey: ["student-documents"] });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Upload failed. Please try again.";
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

  // Build a map of uploaded doc types → document
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
    <PageWrapper title="Documents" subtitle="Build your application document portfolio.">
      {/* Document Readiness Header */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center"
              style={{ boxShadow: "0 0 20px rgba(79,70,229,0.2)" }}
            >
              <Shield size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-black tracking-tight">Document Readiness</h2>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                {requiredUploaded}/{requiredCount} required documents uploaded
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white tracking-tight">{uploadedCount}</div>
            <div className="text-slate-500 text-xs">/ {DOC_TYPES.length} docs</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-white/6 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progressPct === 100
                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                : progressPct >= 50
                ? "bg-gradient-to-r from-indigo-600 to-blue-400"
                : "bg-gradient-to-r from-indigo-700 to-indigo-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 font-medium">
          <span>0%</span>
          <span className={progressPct >= 100 ? "text-emerald-400 font-bold" : "text-slate-400"}>
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
                  ? "bg-emerald-600/6 border-emerald-500/20"
                  : "bg-white/2 border-white/6 border-dashed"
              }`}
              style={
                isDone
                  ? { boxShadow: "0 0 20px rgba(16,185,129,0.08)" }
                  : undefined
              }
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-400" style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.6))" }} />
                  ) : (
                    <Circle size={18} className="text-slate-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tracking-tight ${isDone ? "text-white" : "text-slate-600"}`}>
                      {docTypeItem.label}
                    </span>
                    {docTypeItem.required && !isDone && (
                      <span className="tag-pill tag-pill-red text-[8px]">Required</span>
                    )}
                    {isDone && (
                      <span className="tag-pill tag-pill-green text-[8px]">Uploaded</span>
                    )}
                  </div>

                  {/* Uploaded files */}
                  {isDone && (
                    <div className="mt-1.5 space-y-1">
                      {uploaded.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2">
                          <span className="text-emerald-600/80 text-xs truncate">{doc.filename}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300">
                                <ExternalLink size={11} />
                              </a>
                            )}
                            <button
                              onClick={() => setDeleteId(doc.id)}
                              className="text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload CTA for missing doc */}
                  {!isDone && (
                    <button
                      onClick={() => {
                        setDocType(docTypeItem.value);
                        setTimeout(() => fileRef.current?.click(), 50);
                      }}
                      className="mt-1.5 text-xs text-slate-600 hover:text-indigo-400 transition-colors font-medium flex items-center gap-1"
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
          <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
            <Upload size={13} className="text-blue-400" />
          </div>
          <h2 className="text-white font-black tracking-tight">Upload Document</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="bg-white/6 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 flex-1 cursor-pointer"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value} style={{ background: "#111827" }}>
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
        <p className="text-slate-600 text-xs mt-2">Supported: PDF, DOC, DOCX, JPG, PNG · max 10MB</p>
      </GlassCard>

      {isLoading && <LoadingSpinner size="lg" className="py-10" />}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Document"
        description="This will permanently delete the document. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </PageWrapper>
  );
}
