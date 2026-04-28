"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  Upload, CheckCircle2, Trash2, ExternalLink, Shield,
  FileText, Loader2, AlertCircle, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Document, DocType } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DOC_TYPES: { value: DocType; label: string; required: boolean; desc: string }[] = [
  { value: "passport",   label: "Passport",                 required: true,  desc: "A clear scan of your passport bio page" },
  { value: "transcript", label: "Transcript",               required: true,  desc: "Official academic transcripts" },
  { value: "sop",        label: "Statement of Purpose",     required: true,  desc: "Your personal statement / SOP" },
  { value: "lor",        label: "Letter of Recommendation", required: true,  desc: "Academic or professional reference" },
  { value: "cv",         label: "CV / Resume",              required: true,  desc: "Your up-to-date curriculum vitae" },
  { value: "ielts",      label: "IELTS Certificate",        required: false, desc: "IELTS test result document" },
  { value: "toefl",      label: "TOEFL Certificate",        required: false, desc: "TOEFL test result document" },
  { value: "gre",        label: "GRE Score Report",         required: false, desc: "GRE official score report" },
  { value: "gmat",       label: "GMAT Score Report",        required: false, desc: "GMAT official score report" },
  { value: "other",      label: "Other",                    required: false, desc: "Any additional supporting document" },
];

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

function DocCard({
  docType,
  uploaded,
  onDelete,
}: {
  docType: (typeof DOC_TYPES)[number];
  uploaded: Document[];
  onDelete: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const isDone = uploaded.length > 0;

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType.value);
      await api.post("/documents/upload", formData);
      toast.success(`${docType.label} uploaded!`);
      qc.invalidateQueries({ queryKey: ["student-documents"] });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Upload failed. Try again.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  }, [docType.value, docType.label, qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) handleUpload(files[0]);
    },
    accept: ACCEPTED_TYPES,
    multiple: false,
    noClick: isDone,
    noDrag: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer outline-none
        ${isDragActive
          ? "bg-emerald-50 border-emerald-500 border-dashed shadow-sm"
          : isDone
            ? "bg-white border-slate-200 hover:border-slate-300"
            : "bg-white border-slate-200 border-dashed hover:border-emerald-300 hover:bg-emerald-50/30"
        }
        ${isUploading ? "pointer-events-none opacity-70" : ""}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isDone ? "bg-emerald-50" : "bg-slate-50"
        }`}>
          {isUploading ? (
            <Loader2 size={16} className="text-emerald-500 animate-spin" />
          ) : isDone ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <Upload size={16} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-semibold ${isDone ? "text-slate-900" : "text-slate-700"}`}>
              {docType.label}
            </span>
            {docType.required && !isDone && (
              <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                Required
              </span>
            )}
            {isDone && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                Uploaded
              </span>
            )}
          </div>

          {isDone ? (
            <div className="space-y-1.5 mt-1">
              {uploaded.map((doc) => (
                <div key={doc.id}>
                  <div className="flex items-center justify-between gap-2 group/file">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText size={11} className="text-slate-400 shrink-0" />
                      <span className="text-slate-600 text-xs truncate">{doc.filename}</span>
                      {doc.verification_status === "verified" && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full shrink-0">
                          <ShieldCheck size={9} /> Verified
                        </span>
                      )}
                      {doc.verification_status === "rejected" && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full shrink-0">
                          <AlertCircle size={9} /> Rejected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-500 hover:text-emerald-700"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(doc.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {doc.verification_status === "rejected" && doc.rejection_reason && (
                    <p className="text-[11px] text-rose-500 mt-1 ml-5">
                      {doc.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs mt-0.5">
              {isDragActive ? "Drop to upload" : docType.desc}
            </p>
          )}
        </div>
      </div>

      {/* Drag overlay hint */}
      {isDragActive && !isDone && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-50/50 flex items-center justify-center pointer-events-none">
          <span className="text-emerald-600 text-sm font-semibold">Drop file here</span>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["student-documents"],
    queryFn: async () => {
      const res = await api.get("/documents");
      return res.data?.items ?? res.data ?? [];
    },
  });

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

  // Build a map of uploaded doc types -> documents
  const uploadedMap = new Map<DocType, Document[]>();
  for (const doc of documents) {
    const existing = uploadedMap.get(doc.doc_type) ?? [];
    uploadedMap.set(doc.doc_type, [...existing, doc]);
  }

  const requiredTypes = DOC_TYPES.filter((t) => t.required);
  const optionalTypes = DOC_TYPES.filter((t) => !t.required);
  const uploadedCount = DOC_TYPES.filter((t) => uploadedMap.has(t.value)).length;
  const requiredCount = requiredTypes.length;
  const requiredUploaded = requiredTypes.filter((t) => uploadedMap.has(t.value)).length;
  const progressPct = Math.round((uploadedCount / DOC_TYPES.length) * 100);

  if (isLoading) {
    return (
      <PageWrapper title="Documents" subtitle="Your docs, sorted.">
        <div className="flex justify-center py-20">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading documents...
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Documents" subtitle="Click or drag files onto each card to upload.">
      {/* Doc Readiness Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Shield size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-sm">Doc Readiness</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {requiredUploaded}/{requiredCount} required &middot; {uploadedCount}/{DOC_TYPES.length} total
              </p>
            </div>
          </div>
          <span className={`text-2xl font-bold tracking-tight ${
            progressPct === 100 ? "text-emerald-600" : "text-slate-900"
          }`}>
            {progressPct}%
          </span>
        </div>

        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              progressPct === 100
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-blue-400 to-blue-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Required Documents */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Required Documents
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {requiredTypes.map((docType) => (
            <DocCard
              key={docType.value}
              docType={docType}
              uploaded={uploadedMap.get(docType.value) ?? []}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      </div>

      {/* Optional Documents */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Optional Documents
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {optionalTypes.map((docType) => (
            <DocCard
              key={docType.value}
              docType={docType}
              uploaded={uploadedMap.get(docType.value) ?? []}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      </div>

      {/* File type hint */}
      <p className="text-slate-400 text-xs mt-4 text-center">
        Accepted: PDF, DOC, DOCX, JPG, PNG &middot; max 10 MB per file
      </p>

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
