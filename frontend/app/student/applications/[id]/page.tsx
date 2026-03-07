"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, MessageCircle, FileText, Clock } from "lucide-react";
import api from "@/lib/api";
import type { Application, StatusHistoryEntry } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ApplicationDetailPage() {
  const { id } = useParams();

  const { data: app, isLoading } = useQuery<Application>({
    queryKey: ["application", id],
    queryFn: async () => {
      const res = await api.get(`/applications/${id}`);
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (!app) return <div className="text-slate-400 text-center mt-20">Application not found.</div>;

  const whatsappLink = app.consultant?.whatsapp
    ? `https://wa.me/${app.consultant.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <PageWrapper
      title={app.university?.name ?? "Application"}
      subtitle={app.program?.name}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* University + Status */}
          <GlassCard>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold">{app.university?.name}</h2>
                <p className="text-slate-400 text-sm">{app.program?.name}</p>
                <p className="text-slate-500 text-xs">{app.university?.country}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          </GlassCard>

          {/* Status Timeline */}
          {app.status_history && app.status_history.length > 0 && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-white font-semibold">Status History</h3>
              </div>
              <div className="space-y-4">
                {app.status_history.map((entry: StatusHistoryEntry, i: number) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${i === 0 ? "bg-blue-500" : "bg-white/20"}`} />
                      {i < app.status_history!.length - 1 && (
                        <div className="w-px flex-1 bg-white/10 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <StatusBadge status={entry.to_status} />
                      {entry.note && <p className="text-slate-400 text-xs mt-1">{entry.note}</p>}
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Documents */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <h3 className="text-white font-semibold">Documents</h3>
              </div>
              <Link href="/student/documents">
                <Button size="sm" variant="outline" className="border-white/10 text-slate-300 hover:bg-white/8">
                  Manage Documents
                </Button>
              </Link>
            </div>
            {app.documents && app.documents.length > 0 ? (
              <div className="space-y-2">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white/4 rounded-lg">
                    <div>
                      <div className="text-white text-sm font-medium capitalize">{doc.doc_type.replace(/_/g, " ")}</div>
                      <div className="text-slate-500 text-xs">{doc.filename}</div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:text-blue-300">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No documents uploaded for this application.</p>
            )}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Consultant */}
          {app.consultant && (
            <GlassCard>
              <h3 className="text-white font-semibold mb-3">Your Consultant</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-purple-400 font-semibold text-sm">
                    {app.consultant.full_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{app.consultant.full_name}</div>
                  <div className="text-slate-400 text-xs">{app.consultant.role_title ?? "Consultant"}</div>
                </div>
              </div>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle size={15} className="mr-2" /> WhatsApp
                  </Button>
                </a>
              )}
            </GlassCard>
          )}

          {/* Info */}
          <GlassCard>
            <h3 className="text-white font-semibold mb-3">Application Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-white">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-white">{new Date(app.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
