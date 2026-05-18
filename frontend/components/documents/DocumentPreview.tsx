"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  url: string | null;
  filename?: string;
}

export function DocumentPreview({ open, onClose, url, filename }: DocumentPreviewProps) {
  if (!url) return null;

  const ext = (filename || url).split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isPDF = ext === "pdf";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate text-sm">{filename || "Document Preview"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-slate-100">
          {isImage && (
            <img
              src={url}
              alt={filename || "Document"}
              className="w-full h-full object-contain"
            />
          )}
          {isPDF && (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={filename || "PDF Preview"}
            />
          )}
          {!isImage && !isPDF && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={48} className="mb-3" />
              <p className="text-sm">Preview not available for this file type</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
