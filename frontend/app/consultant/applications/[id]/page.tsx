"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Clock, FileText, UserRoundCog } from "lucide-react";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

const NEXT_STATUSES: Record<string, AppStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "rejected", "withdrawn"],
  under_review: ["offer_received", "rejected", "withdrawn"],
  offer_received: ["enrolled", "withdrawn"],
  enrolled: [],
  rejected: [],
  withdrawn: [],
};

export default function ConsultantApplicationDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectedColleagueId, setSelectedColleagueId] = useState("");

  const { data: app, isLoading } = useQuery<Application>({
    queryKey: ["application-detail", id],
    queryFn: async () => {
      const res = await api.get(`/applications/${id}`);
      return res.data;
    },
  });

  const { data: colleagues = [] } = useQuery<{ id: string; full_name: string; role: string }[]>({
    queryKey: ["my-colleagues"],
    queryFn: async () => {
      const res = await api.get("/consultants/me/colleagues");
      return res.data ?? [];
    },
    enabled: !!app,
  });

  const forwardMutation = useMutation({
    mutationFn: async ({ consultant_id, note }: { consultant_id: string; note?: string }) => {
      await api.patch(`/applications/${id}/forward`, { consultant_id, note });
    },
    onSuccess: () => {
      toast.success("Application forwarded!");
      setForwardOpen(false);
      setSelectedColleagueId("");
      qc.invalidateQueries({ queryKey: ["application-detail", id] });
    },
    onError: () => toast.error("Failed to forward application"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, note }: { status: AppStatus; note?: string }) => {
      await api.patch(`/applications/${id}/status`, { status, note });
    },
    onSuccess: () => {
      toast.success("Status updated!");
      setNote("");
      qc.invalidateQueries({ queryKey: ["application-detail", id] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (!app) return <div className="text-slate-400 text-center mt-20">Not found.</div>;

  const student = app.student;
  const whatsapp = student?.phone
    ? `https://wa.me/${student.phone.replace(/\D/g, "")}`
    : null;

  const nextStatuses = NEXT_STATUSES[app.status] ?? [];

  return (
    <PageWrapper title="Application Detail" subtitle={`${student?.full_name ?? "Student"} — ${app.university?.name}`}>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Profile Summary */}
          {student && (
            <GlassCard>
              <h3 className="text-white font-semibold mb-4">Student Profile</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "Name", value: student.full_name },
                  { label: "Email", value: student.email },
                  { label: "Nationality", value: student.nationality ?? "—" },
                  { label: "SSC GPA", value: student.ssc_gpa ?? "—" },
                  { label: "HSC GPA", value: student.hsc_gpa ?? "—" },
                  { label: "Bachelor GPA", value: student.bachelor_gpa ?? "—" },
                  { label: "IELTS", value: student.ielts_score ?? "—" },
                  { label: "TOEFL", value: student.toefl_score ?? "—" },
                  { label: "GRE", value: student.gre_score ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-slate-500 text-xs">{label}</div>
                    <div className="text-white font-medium">{String(value)}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Status Update */}
          {nextStatuses.length > 0 && (
            <GlassCard>
              <h3 className="text-white font-semibold mb-4">Update Status</h3>
              <div className="mb-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={2}
                  className="w-full bg-white/8 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    onClick={() => updateStatus.mutate({ status: s, note })}
                    disabled={updateStatus.isPending}
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:bg-white/8 capitalize"
                  >
                    → {s.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Status Timeline */}
          {app.status_history && app.status_history.length > 0 && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-white font-semibold">Status History</h3>
              </div>
              <div className="space-y-4">
                {app.status_history.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? "bg-blue-500" : "bg-white/20"}`} />
                      {i < app.status_history!.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <StatusBadge status={entry.to_status} />
                      {entry.note && <p className="text-slate-400 text-xs mt-1">{entry.note}</p>}
                      <p className="text-slate-500 text-xs mt-1">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Documents */}
          {app.documents && app.documents.length > 0 && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-slate-400" />
                <h3 className="text-white font-semibold">Student Documents</h3>
              </div>
              <div className="space-y-2">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white/4 rounded-lg">
                    <div>
                      <div className="text-white text-sm capitalize">{doc.doc_type.replace(/_/g, " ")}</div>
                      <div className="text-slate-500 text-xs">{doc.filename}</div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:text-blue-300">View</a>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Current Status</h3>
            </div>
            <StatusBadge status={app.status} />
          </GlassCard>

          {whatsapp && (
            <GlassCard>
              <h3 className="text-white font-semibold mb-3">Contact Student</h3>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle size={15} className="mr-2" /> WhatsApp
                </Button>
              </a>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="text-white font-semibold mb-3">University</h3>
            <div className="text-white font-medium text-sm">{app.university?.name}</div>
            <div className="text-slate-400 text-xs">{app.program?.name}</div>
            <div className="text-slate-500 text-xs">{app.university?.country}</div>
          </GlassCard>

          {colleagues.length > 0 && (
            <GlassCard>
              <h3 className="text-white font-semibold mb-3">Team</h3>
              <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
                <DialogTrigger>
                  <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/8">
                    <UserRoundCog size={15} className="mr-2" /> Forward to Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0F172A] border border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Forward Application</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 py-2">
                    {colleagues.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColleagueId(c.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedColleagueId === c.id
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-white/10 bg-white/4 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        <div className="font-medium text-sm">{c.full_name}</div>
                        <div className="text-xs text-slate-500 capitalize">{c.role}</div>
                      </button>
                    ))}
                  </div>
                  <DialogFooter showCloseButton>
                    <Button
                      onClick={() => forwardMutation.mutate({ consultant_id: selectedColleagueId, note: undefined })}
                      disabled={!selectedColleagueId || forwardMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {forwardMutation.isPending ? "Forwarding..." : "Forward"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </GlassCard>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
