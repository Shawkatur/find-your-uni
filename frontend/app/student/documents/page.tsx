"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import api from "@/lib/api";
import type { Document, DocType } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "transcript", label: "Transcript" },
  { value: "sop", label: "Statement of Purpose" },
  { value: "lor", label: "Letter of Recommendation" },
  { value: "cv", label: "CV / Resume" },
  { value: "ielts", label: "IELTS Certificate" },
  { value: "toefl", label: "TOEFL Certificate" },
  { value: "gre", label: "GRE Score Report" },
  { value: "gmat", label: "GMAT Score Report" },
  { value: "other", label: "Other" },
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
      // 1. Get pre-signed URL
      const { data } = await api.post("/documents/upload-url", {
        doc_type: docType,
        filename: file.name,
        content_type: file.type,
      });

      // 2. PUT to R2
      await axios.put(data.upload_url, file, {
        headers: { "Content-Type": file.type },
      });

      // 3. Confirm upload
      await api.post("/documents", {
        doc_type: docType,
        filename: file.name,
        r2_key: data.key,
      });

      toast.success("Document uploaded successfully!");
      qc.invalidateQueries({ queryKey: ["student-documents"] });
    } catch {
      toast.error("Upload failed. Please try again.");
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

  return (
    <PageWrapper title="Documents" subtitle="Manage your uploaded documents.">
      {/* Upload Section */}
      <GlassCard className="mb-6">
        <h2 className="text-white font-semibold mb-4">Upload New Document</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="bg-white/8 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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

          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? (
              <><LoadingSpinner size="sm" className="mr-2" /> Uploading...</>
            ) : (
              <><Upload size={15} className="mr-2" /> Choose File</>
            )}
          </Button>
        </div>
        <p className="text-slate-500 text-xs mt-2">Supported: PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
      </GlassCard>

      {/* Documents List */}
      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload your transcripts, test certificates, and other documents."
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <GlassCard key={doc.id} padding={false} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm capitalize">
                      {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label ?? doc.doc_type}
                    </div>
                    <div className="text-slate-400 text-xs">{doc.filename}</div>
                    <div className="text-slate-500 text-xs">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-white/10 text-slate-300 hover:bg-white/8">
                        View
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(doc.id)}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

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
