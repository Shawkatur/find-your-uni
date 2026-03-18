"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, MessageCircle, FileText, CheckCircle2, Circle, Clock } from "lucide-react";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Full linear application journey
const JOURNEY_STEPS: { status: AppStatus; label: string; desc: string }[] = [
  { status: "draft",          label: "Application Created",  desc: "Your application has been started." },
  { status: "submitted",      label: "Submitted",            desc: "Application sent to the university." },
  { status: "under_review",   label: "Under Review",         desc: "Admissions team is reviewing your documents." },
  { status: "offer_received", label: "Offer Received",       desc: "Congratulations — you have received an offer!" },
  { status: "enrolled",       label: "Enrolled",             desc: "You are now enrolled at this university." },
];

// Terminal negative statuses shown separately
const TERMINAL_NEGATIVE: AppStatus[] = ["rejected", "withdrawn"];

const STATUS_ORDER: AppStatus[] = ["draft", "submitted", "under_review", "offer_received", "enrolled"];

function getStepState(stepStatus: AppStatus, currentStatus: AppStatus): "done" | "current" | "future" {
  if (TERMINAL_NEGATIVE.includes(currentStatus)) {
    // All steps before current are done; treat last known as done
    return "done";
  }
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "future";
}

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

  const isTerminalNegative = TERMINAL_NEGATIVE.includes(app.status);
  const journeySteps = isTerminalNegative ? JOURNEY_STEPS : JOURNEY_STEPS;
  const completedCount = isTerminalNegative
    ? STATUS_ORDER.length
    : STATUS_ORDER.indexOf(app.status) + 1;

  return (
    <PageWrapper
      title={app.university?.name ?? "Application"}
      subtitle={app.program?.name}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* University header card */}
          <GlassCard>
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20"
                style={{ boxShadow: "0 0 30px rgba(79,70,229,0.2)" }}
              >
                <Building2 size={22} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-black tracking-tight text-lg">{app.university?.name}</h2>
                <p className="text-slate-400 text-sm font-medium">{app.program?.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{app.university?.country}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          </GlassCard>

          {/* Application Journey Timeline */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
                <h3 className="text-white font-black tracking-tight">Application Journey</h3>
              </div>
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-white/6 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / journeySteps.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  {completedCount}/{journeySteps.length}
                </span>
              </div>
            </div>

            {/* Rejected / Withdrawn banner */}
            {isTerminalNegative && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-red-400 text-sm font-semibold capitalize">
                  Application {app.status}
                  {app.status_history?.at(-1)?.note && (
                    <span className="text-red-400/70 font-normal ml-2">
                      — {app.status_history.at(-1)!.note}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Timeline steps */}
            <div className="space-y-0">
              {journeySteps.map((step, i) => {
                const state = getStepState(step.status, app.status);
                const isLast = i === journeySteps.length - 1;

                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Connector column */}
                    <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
                      {/* Dot */}
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center z-10 ${
                          state === "done"
                            ? "timeline-dot-done"
                            : state === "current"
                            ? "timeline-dot-current"
                            : "timeline-dot-future"
                        }`}
                      >
                        {state === "done" && (
                          <CheckCircle2 size={10} className="text-emerald-950" />
                        )}
                        {state === "current" && (
                          <Circle size={8} className="text-white fill-white" />
                        )}
                      </div>
                      {/* Line */}
                      {!isLast && (
                        <div
                          className={`w-px flex-1 my-1 ${
                            state === "done"
                              ? "timeline-line-done"
                              : state === "current"
                              ? "timeline-line-current"
                              : "timeline-line-future"
                          }`}
                          style={{ minHeight: 28 }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-5 flex-1 ${isLast ? "pb-0" : ""}`}>
                      <div
                        className={`font-bold text-sm tracking-tight ${
                          state === "done"
                            ? "text-emerald-400"
                            : state === "current"
                            ? "text-indigo-300"
                            : "text-slate-600"
                        }`}
                      >
                        {step.label}
                        {state === "current" && (
                          <span className="ml-2 tag-pill tag-pill-indigo text-[9px] align-middle">
                            Current
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 font-normal ${
                          state === "future" ? "text-slate-700" : "text-slate-500"
                        }`}
                      >
                        {step.desc}
                      </p>
                      {/* Show timestamp from history if available */}
                      {state !== "future" && app.status_history && (() => {
                        const entry = app.status_history.find((h) => h.status === step.status);
                        return entry ? (
                          <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                            <Clock size={9} />
                            {new Date(entry.changed_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Documents */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                  <FileText size={13} className="text-blue-400" />
                </div>
                <h3 className="text-white font-black tracking-tight">Documents</h3>
              </div>
              <Link href="/student/documents">
                <Button size="sm" variant="outline">
                  Manage Documents
                </Button>
              </Link>
            </div>
            {app.documents && app.documents.length > 0 ? (
              <div className="space-y-2">
                {app.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-emerald-600/5 border border-emerald-500/15 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-white text-sm font-semibold capitalize">
                          {doc.doc_type.replace(/_/g, " ")}
                        </div>
                        <div className="text-slate-500 text-xs">{doc.filename}</div>
                      </div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-400 text-xs hover:text-indigo-300 font-semibold">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No documents uploaded for this application.</p>
            )}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Consultant */}
          {app.consultant && (
            <GlassCard>
              <h3 className="text-white font-black tracking-tight mb-4">Your Consultant</h3>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 bg-violet-600/15 rounded-2xl flex items-center justify-center border border-violet-500/25"
                  style={{ boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}
                >
                  <span className="text-violet-400 font-black text-sm">
                    {app.consultant.full_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{app.consultant.full_name}</div>
                  <div className="text-slate-400 text-xs">{app.consultant.role_title ?? "Consultant"}</div>
                </div>
              </div>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_0_#065f46] hover:shadow-[0_6px_0_#065f46] active:shadow-none active:translate-y-[3px]">
                    <MessageCircle size={15} className="mr-2" /> WhatsApp
                  </Button>
                </a>
              )}
            </GlassCard>
          )}

          {/* Application Info */}
          <GlassCard>
            <h3 className="text-white font-black tracking-tight mb-4">Application Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status</span>
                <StatusBadge status={app.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Created</span>
                <span className="text-white font-semibold">
                  {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Last Updated</span>
                <span className="text-white font-semibold">
                  {new Date(app.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
