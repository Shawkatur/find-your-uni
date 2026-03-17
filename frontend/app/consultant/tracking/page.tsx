"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Copy, Check, X } from "lucide-react";
import api from "@/lib/api";
import type { TrackingLink } from "@/types";

const APP_URL =
  (typeof window !== "undefined" ? window.location.origin : "") ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      title="Copy link"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Create Link Dialog ────────────────────────────────────────────────────────

function CreateLinkDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => api.post("/tracking-links", { name: name || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracking-links"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">New Tracking Link</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Campaign Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Facebook Campaign, April Fair"
              className="w-full bg-white/8 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-slate-500 text-xs">
            A unique 8-character code will be generated automatically.
          </p>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ConsultantTrackingPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: links, isLoading } = useQuery<TrackingLink[]>({
    queryKey: ["tracking-links"],
    queryFn: () => api.get("/tracking-links").then((r) => r.data),
  });

  const adminIntakeUrl = `${APP_URL}/intake/admin`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/15 flex items-center justify-center border border-blue-500/25">
            <Link2 size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Tracking Links</h1>
            <p className="text-slate-400 text-sm">Generate shareable intake links</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={15} />
          Create Link
        </button>
      </div>

      {/* Admin generic link */}
      <div className="glass-card p-4 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5 font-semibold">
              Platform Generic Link
            </p>
            <p className="text-white text-sm font-mono">{adminIntakeUrl}</p>
          </div>
          <CopyButton text={adminIntakeUrl} />
        </div>
      </div>

      {/* Consultant tracking links */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Code</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Clicks</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 py-12 text-sm">Loading…</td>
              </tr>
            )}
            {!isLoading && (!links || links.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Link2 size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No tracking links yet</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-3 text-blue-400 hover:text-blue-300 text-xs font-semibold"
                  >
                    Create your first link →
                  </button>
                </td>
              </tr>
            )}
            {links?.map((link) => {
              const fullUrl = `${APP_URL}/intake/${link.code}`;
              return (
                <tr key={link.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">
                    {link.name ?? <span className="text-slate-500 italic">Unnamed</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono hidden sm:table-cell">
                    {link.code}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {link.clicks}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-slate-500 text-xs font-mono truncate max-w-[180px] hidden md:block">
                        {fullUrl}
                      </span>
                      <CopyButton text={fullUrl} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateLinkDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}
