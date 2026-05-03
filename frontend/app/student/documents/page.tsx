"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  Upload, Trash2, ExternalLink, Shield,
  FileText, Loader2, AlertCircle, ShieldCheck,
  HelpCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Document, DocType } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocTypeConfig {
  value: DocType;
  label: string;
  guideline: string;
  subTypes?: { value: DocType; label: string }[];
}

const DOC_TYPES: DocTypeConfig[] = [
  { value: "passport",   label: "Passport",                 guideline: "Upload a clear, color scan of your passport bio page. Must be valid for at least 6 months." },
  { value: "transcript", label: "Transcript",               guideline: "Please upload all semester mark sheets. If not in English, include certified translations." },
  { value: "sop",        label: "Statement of Purpose",     guideline: "1\u20132 pages. Explain your motivation, academic goals, and why you chose this field/country." },
  { value: "lor",        label: "Letter of Recommendation", guideline: "Academic or professional reference letter. Upload on signed letterhead if possible." },
  { value: "cv",         label: "CV / Resume",              guideline: "2 pages max. Include education, work experience, and relevant skills." },
  {
    value: "ielts",
    label: "Language Proficiency",
    guideline: "Upload your official test score report (IELTS, TOEFL, PTE, or Duolingo).",
    subTypes: [
      { value: "ielts", label: "IELTS" },
      { value: "toefl", label: "TOEFL" },
      { value: "pte", label: "PTE" },
      { value: "duolingo", label: "Duolingo" },
    ],
  },
  {
    value: "gre",
    label: "Standardized Test",
    guideline: "Upload your official score report (GRE, GMAT, or SAT).",
    subTypes: [
      { value: "gre", label: "GRE" },
      { value: "gmat", label: "GMAT" },
      { value: "sat", label: "SAT" },
    ],
  },
  { value: "other",      label: "Other",                    guideline: "Any additional documents requested by your consultant or university." },
];

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const SUB_TYPE_LABEL: Record<string, string> = {
  ielts: "IELTS", toefl: "TOEFL", pte: "PTE", duolingo: "Duolingo",
  gre: "GRE", gmat: "GMAT", sat: "SAT",
};

function StatusBadge({ doc }: { doc: Document }) {
  if (doc.verification_status === "verified") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full shrink-0">
        <ShieldCheck size={9} /> Verified
      </span>
    );
  }
  if (doc.verification_status === "rejected") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full shrink-0">
        <AlertCircle size={9} /> Action Needed
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full shrink-0 cursor-help"
      >
        <Clock size={9} /> Pending Review
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">Your consultant is reviewing this</p>
      </TooltipContent>
    </Tooltip>
  );
}

function DocCard({
  docType,
  uploaded,
  onDelete,
}: {
  docType: DocTypeConfig;
  uploaded: Document[];
  onDelete: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSubType, setSelectedSubType] = useState<DocType | null>(
    docType.subTypes ? docType.subTypes[0].value : null
  );
  const isDone = uploaded.length > 0;

  const uploadDocType = docType.subTypes ? (selectedSubType ?? docType.subTypes[0].value) : docType.value;

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", uploadDocType);
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
  }, [uploadDocType, docType.label, qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) handleUpload(files[0]);
    },
    accept: ACCEPTED_TYPES,
    multiple: false,
    noClick: isDone && !docType.subTypes,
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
        <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isDone ? "bg-emerald-50" : "bg-slate-50"
        }`}>
          {isUploading ? (
            <Loader2 size={16} className="text-emerald-500 animate-spin" />
          ) : isDone ? (
            <ShieldCheck size={16} className="text-emerald-500" />
          ) : (
            <Upload size={16} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-semibold ${isDone ? "text-slate-900" : "text-slate-700"}`}>
              {docType.label}
            </span>
            <Tooltip>
              <TooltipTrigger
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <HelpCircle size={13} />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px]">
                <p className="text-xs">{docType.guideline}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Sub-type selector for consolidated cards */}
          {docType.subTypes && (
            <div className="mb-2" onClick={(e) => e.stopPropagation()}>
              <Select
                value={selectedSubType ?? docType.subTypes[0].value}
                onValueChange={(val) => setSelectedSubType(val as DocType)}
              >
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {docType.subTypes.map((st) => (
                    <SelectItem key={st.value} value={st.value} className="text-xs">
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isDone ? (
            <div className="space-y-1.5 mt-1">
              {uploaded.map((doc) => (
                <div key={doc.id}>
                  <div className="flex items-center justify-between gap-2 group/file">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText size={11} className="text-slate-400 shrink-0" />
                      <span className="text-slate-600 text-xs truncate">{doc.filename}</span>
                      {SUB_TYPE_LABEL[doc.doc_type] && (
                        <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0">
                          {SUB_TYPE_LABEL[doc.doc_type]}
                        </span>
                      )}
                      <StatusBadge doc={doc} />
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
                    <div className="mt-1.5 ml-5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100">
                      <p className="text-[11px] text-rose-600 font-medium">{doc.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
              {/* Allow additional uploads for consolidated cards */}
              {docType.subTypes && !isUploading && (
                <p className="text-slate-400 text-[10px] mt-1">Drop or click to add another score</p>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-xs mt-0.5">
              {isDragActive ? "Drop to upload" : "Click or drag file to upload"}
            </p>
          )}
        </div>
      </div>

      {isDragActive && (
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

  const uploadedMap = new Map<DocType, Document[]>();
  for (const doc of documents) {
    const existing = uploadedMap.get(doc.doc_type) ?? [];
    uploadedMap.set(doc.doc_type, [...existing, doc]);
  }

  const getUploadsForType = (dt: DocTypeConfig): Document[] => {
    if (dt.subTypes) {
      return dt.subTypes.flatMap((st) => uploadedMap.get(st.value) ?? []);
    }
    return uploadedMap.get(dt.value) ?? [];
  };

  const uploadedCount = DOC_TYPES.filter((dt) => getUploadsForType(dt).length > 0).length;
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
    <TooltipProvider delay={200}>
      <PageWrapper title="Documents" subtitle="Click or drag files onto each card to upload.">
        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Shield size={18} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-slate-900 font-bold text-sm">Doc Readiness</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  {uploadedCount}/{DOC_TYPES.length} uploaded
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

        {/* All document cards — flat grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          {DOC_TYPES.map((docType) => (
            <DocCard
              key={docType.value}
              docType={docType}
              uploaded={getUploadsForType(docType)}
              onDelete={setDeleteId}
            />
          ))}
        </div>

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
    </TooltipProvider>
  );
}
