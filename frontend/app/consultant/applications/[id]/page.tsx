"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MessageCircle, Clock, FileText, UserRoundCog, Bookmark,
  ArrowLeft, Mail, Globe, GraduationCap,
} from "lucide-react";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

// ─── Status maps ────────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  lead:              "bg-slate-100 text-slate-700",
  pre_evaluation:    "bg-blue-50 text-blue-700",
  docs_collection:   "bg-amber-50 text-amber-700",
  applied:           "bg-indigo-50 text-indigo-700",
  offer_received:    "bg-emerald-50 text-emerald-700",
  conditional_offer: "bg-emerald-50 text-emerald-700",
  visa_stage:        "bg-purple-50 text-purple-700",
  enrolled:          "bg-green-50 text-green-700",
  rejected:          "bg-rose-50 text-rose-700",
  withdrawn:         "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  pre_evaluation: "Pre-Evaluation",
  docs_collection: "Docs Collection",
  applied: "Applied",
  offer_received: "Offer Received",
  conditional_offer: "Conditional Offer",
  visa_stage: "Visa Stage",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const NEXT_STATUSES: Record<string, AppStatus[]> = {
  lead:              ["pre_evaluation", "withdrawn"],
  pre_evaluation:    ["docs_collection", "rejected", "withdrawn"],
  docs_collection:   ["applied", "withdrawn"],
  applied:           ["offer_received", "conditional_offer", "rejected", "withdrawn"],
  offer_received:    ["visa_stage", "withdrawn"],
  conditional_offer: ["docs_collection", "offer_received", "rejected", "withdrawn"],
  visa_stage:        ["enrolled", "rejected", "withdrawn"],
  enrolled:          [],
  rejected:          [],
  withdrawn:         [],
};

// Negative transitions get red hover
const NEGATIVE_STATUSES = new Set<string>(["rejected", "withdrawn"]);

// ─── Helpers ────────────────────────────────────────────────────────────────

function fallback(val: unknown): string | null {
  if (val === null || val === undefined || val === "" || val === "-" || val === "—") return null;
  return String(val);
}

function DataValue({ value }: { value: unknown }) {
  const v = fallback(value);
  if (!v) return <span className="text-slate-400 italic text-sm">Not provided</span>;
  return <span className="text-sm font-semibold text-slate-900">{v}</span>;
}

function DataLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{children}</span>;
}

// ─── Shortlist Summary ─────────────────────────────────────────────────────

function ShortlistSummaryCard({ studentId }: { studentId: string }) {
  const { data: items = [] } = useQuery<{ id: string }[]>({
    queryKey: ["student-shortlist", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/shortlist`);
      return res.data ?? [];
    },
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bookmark size={15} className="text-emerald-600" />
        <h3 className="text-slate-900 font-semibold text-sm">Shortlist</h3>
      </div>
      <p className="text-slate-500 text-sm mb-3">
        {items.length > 0
          ? `${items.length} universit${items.length === 1 ? "y" : "ies"} saved`
          : "No universities saved yet"}
      </p>
      <Link href={`/consultant/students/${studentId}/shortlist`}>
        <Button variant="outline" size="sm" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
          {items.length > 0 ? "View Shortlist" : "Add Universities"}
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

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
      const data = res.data;
      return {
        ...data,
        student: data.students ?? data.student,
        program: data.programs ?? data.program,
        university: data.programs?.universities ?? data.university,
        consultant: data.consultants ?? data.consultant,
      };
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

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <Skeleton className="h-5 w-28 mb-4" />
              <Skeleton className="h-16 w-full mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-40 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!app) return <div className="text-slate-500 text-center mt-20">Not found.</div>;

  const student = app.student;

  const whatsapp = student?.phone
    ? `https://wa.me/${student.phone.replace(/\D/g, "")}`
    : null;

  const nextStatuses = NEXT_STATUSES[app.status] ?? [];

  return (
    <PageWrapper>
      {/* ─── Back link ───────────────────────────────────────────────────── */}
      <Link
        href="/consultant/applications"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to Applications
      </Link>

      {/* ─── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {student?.full_name ?? "Student"}
        </h1>
        <div className="flex items-center gap-2 self-start">
          <span className={`rounded-full text-[11px] font-bold uppercase tracking-wider px-3 py-1 ${STATUS_PILL[app.status] ?? "bg-slate-100 text-slate-700"}`}>
            {STATUS_LABEL[app.status] ?? app.status}
          </span>
          {app.assigned_source === "admin" && (
            <span className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
              Admin Assigned
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── Main column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Student Profile Card */}
          {student && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 font-semibold mb-4">Student Profile</h3>

              {/* Personal section */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mail size={12} className="text-slate-400" />
                    <DataLabel>Phone</DataLabel>
                  </div>
                  <DataValue value={student.phone} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Globe size={12} className="text-slate-400" />
                    <DataLabel>Field of Study</DataLabel>
                  </div>
                  <DataValue value={student.academic_history?.bachelor_subject} />
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-slate-100 mb-5" />

              {/* Academic section */}
              <div className="flex items-center gap-1.5 mb-3">
                <GraduationCap size={13} className="text-slate-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Academics & Test Scores</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <DataLabel>SSC GPA</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.academic_history?.ssc_gpa} /></div>
                </div>
                <div>
                  <DataLabel>HSC GPA</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.academic_history?.hsc_gpa} /></div>
                </div>
                <div>
                  <DataLabel>Bachelor GPA</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.academic_history?.bachelor_cgpa} /></div>
                </div>
                <div>
                  <DataLabel>IELTS</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.test_scores?.ielts} /></div>
                </div>
                <div>
                  <DataLabel>TOEFL</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.test_scores?.toefl} /></div>
                </div>
                <div>
                  <DataLabel>GRE</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.test_scores?.gre} /></div>
                </div>
                <div>
                  <DataLabel>GMAT</DataLabel>
                  <div className="mt-0.5"><DataValue value={student.test_scores?.gmat} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Action Center ───────────────────────────────────────────── */}
          {nextStatuses.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 font-semibold mb-4">Action Center</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none mb-4 transition-colors"
              />
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => {
                  const isNeg = NEGATIVE_STATUSES.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus.mutate({ status: s, note })}
                      disabled={updateStatus.isPending}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold capitalize transition-all disabled:opacity-50 ${
                        isNeg
                          ? "border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                          : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      → {s.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Activity Timeline ───────────────────────────────────────── */}
          {app.status_history && app.status_history.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={15} className="text-slate-400" />
                <h3 className="text-slate-900 font-semibold">Activity</h3>
              </div>
              <div className="relative">
                {app.status_history.map((entry, i) => {
                  const isFirst = i === 0;
                  const isLast = i === app.status_history!.length - 1;
                  return (
                    <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* Vertical line */}
                      {!isLast && (
                        <div className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-200" />
                      )}
                      {/* Dot */}
                      <div className={`relative z-10 mt-1 w-[11px] h-[11px] rounded-full shrink-0 ring-2 ring-white ${isFirst ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_PILL[entry.status] ?? "bg-slate-100 text-slate-700"}`}>
                            {STATUS_LABEL[entry.status] ?? entry.status}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0">
                            {new Date(entry.changed_at).toLocaleDateString(undefined, {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Documents ───────────────────────────────────────────────── */}
          {app.documents && app.documents.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={15} className="text-slate-400" />
                <h3 className="text-slate-900 font-semibold">Documents</h3>
              </div>
              <div className="space-y-2">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div>
                      <div className="text-slate-900 text-sm font-medium capitalize">{doc.doc_type.replace(/_/g, " ")}</div>
                      <div className="text-slate-500 text-xs">{doc.filename}</div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-emerald-600 text-xs font-medium hover:text-emerald-700 transition-colors">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right column ────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Contact */}
          {whatsapp && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 font-semibold text-sm mb-3">Contact Student</h3>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="block">
                <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors">
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </a>
              <p className="text-slate-400 text-xs mt-2 text-center">{student?.phone}</p>
            </div>
          )}

          {/* University */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-slate-900 font-semibold text-sm mb-3">University</h3>
            {app.university?.name ? (
              <>
                <div className="font-bold text-slate-900 text-sm">{app.university.name}</div>
                {app.program?.name && (
                  <div className="text-sm text-slate-600 mt-0.5">{app.program.name}</div>
                )}
                {app.university?.country && (
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">{app.university.country}</div>
                )}
              </>
            ) : (
              <span className="text-slate-400 italic text-sm">Pending university selection</span>
            )}
          </div>

          {/* Shortlist */}
          {app.student_id && (
            <ShortlistSummaryCard studentId={app.student_id} />
          )}

          {/* Team / Forward */}
          {colleagues.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 font-semibold text-sm mb-3">Team</h3>
              <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
                <DialogTrigger>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
                    <UserRoundCog size={15} className="mr-2" /> Forward to Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-slate-200 text-slate-900">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">Forward Application</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 py-2">
                    {colleagues.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColleagueId(c.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedColleagueId === c.id
                            ? "border-emerald-500 bg-emerald-50 text-slate-900"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
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
                    >
                      {forwardMutation.isPending ? "Forwarding..." : "Forward"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
