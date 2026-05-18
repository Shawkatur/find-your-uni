"use client";

import { useState } from "react";
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  url: string | null;
  filename?: string;
}

export function DocumentPreview({
  open,
  onClose,
  url,
  filename,
}: DocumentPreviewProps) {
  const [imageLoading, setImageLoading] = useState(true);

  if (!open || !url) return null;

  const displayName = filename || "document";
  const ext = (filename || url).split(".").pop()?.toLowerCase() || "";
  const isPdf = ext === "pdf" || url.toLowerCase().includes(".pdf");
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf ? (
              <FileText size={18} className="text-red-500 shrink-0" />
            ) : isImage ? (
              <ImageIcon size={18} className="text-blue-500 shrink-0" />
            ) : (
              <FileText size={18} className="text-slate-500 shrink-0" />
            )}
            <span className="text-sm font-medium text-foreground truncate">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
            <a
              href={url}
              download={displayName}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Download"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-secondary/30 min-h-0">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=1`}
              className="w-full h-full rounded-lg border border-border"
              title={displayName}
            />
          ) : isImage ? (
            <div className="relative flex items-center justify-center h-full">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="text-muted-foreground animate-spin" />
                </div>
              )}
              <img
                src={url}
                alt={displayName}
                className="max-w-full max-h-full object-contain rounded-lg"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText size={48} className="mb-3" />
              <p className="text-sm">Preview not available for this file type</p>
              <a
                href={url}
                download={displayName}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
