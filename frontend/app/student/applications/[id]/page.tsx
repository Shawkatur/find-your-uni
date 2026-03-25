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

// Full linear application journey (matches backend status flow)
const JOURNEY_STEPS: { status: AppStatus; label: string; desc: string }[] = [
  { status: "lead",            label: "Started",                desc: "Your application has been kicked off." },
  { status: "pre_evaluation",  label: "Pre-Evaluation",        desc: "We're reviewing your profile." },
  { status: "docs_collection", label: "Docs Collection",        desc: "Gathering your documents." },
  { status: "applied",         label: "Applied",               desc: "Sent to the uni — fingers crossed!" },
  { status: "offer_received",  label: "Offer Received",        desc: "You got an offer!" },
  { status: "visa_stage",      label: "Visa Stage",            desc: "Processing your visa." },
  { status: "enrolled",        label: "Enrolled",              desc: "You're in! Congrats." },
];

// Terminal negative statuses shown separately
const TERMINAL_NEGATIVE: AppStatus[] = ["rejected", "withdrawn"];

const STATUS_ORDER: AppStatus[] = ["lead", "pre_evaluation", "docs_collection", "applied", "offer_received", "visa_stage", "enrolled"];

function getStepState(stepStatus: AppStatus, currentStatus: AppStatus): "done" | "current" | "future" {
  if (TERMINAL_NEGATIVE.includes(currentStatus)) {
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

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (!app) return <div className="text-[#64748B] text-center mt-20">Application not found.</div>;

  const whatsappLink = app.consultant?.whatsapp
    ? `https://wa.me/${app.consultant.whatsapp.replace(/\D/g, "")}`
    : null;

  const isTerminalNegative = TERMINAL_NEGATIVE.includes(app.status);
  const journeySteps = JOURNEY_STEPS;
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
              <div className="w-14 h-14 bg-[rgba(16,185,129,0.06)] rounded-2xl flex items-center justify-center shrink-0 border border-[rgba(16,185,129,0.15)]">
                <Building2 size={22} className="text-[#10B981]" />
              </div>
              <div className="flex-1">
                <h2 className="text-[#333] font-black tracking-tight text-lg">{app.university?.name}</h2>
                <p className="text-[#64748B] text-sm font-medium">{app.program?.name}</p>
                <p className="text-[#64748B] text-xs mt-0.5">{app.university?.country}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          </GlassCard>

          {/* Application Journey Timeline */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-[#10B981]" />
                </div>
                <h3 className="text-[#333] font-black tracking-tight">Your Journey</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / journeySteps.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#64748B] font-bold">
                  {completedCount}/{journeySteps.length}
                </span>
              </div>
            </div>

            {/* Rejected / Withdrawn banner */}
            {isTerminalNegative && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-red-600 text-sm font-semibold capitalize">
                  Application {app.status.replace(/_/g, " ")}
                  {app.status_history?.at(-1)?.note && (
                    <span className="text-red-400 font-normal ml-2">
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
                    <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
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
                          <CheckCircle2 size={10} className="text-white" />
                        )}
                        {state === "current" && (
                          <Circle size={8} className="text-white fill-white" />
                        )}
                      </div>
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

                    <div className={`pb-5 flex-1 ${isLast ? "pb-0" : ""}`}>
                      <div
                        className={`font-bold text-sm tracking-tight ${
                          state === "done"
                            ? "text-[#059669]"
                            : state === "current"
                            ? "text-[#333]"
                            : "text-[#94A3B8]"
                        }`}
                      >
                        {step.label}
                        {state === "current" && (
                          <span className="ml-2 tag-pill tag-pill-green text-[9px] align-middle">
                            Current
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 font-normal ${
                          state === "future" ? "text-[#E2E8F0]" : "text-[#64748B]"
                        }`}
                      >
                        {step.desc}
                      </p>
                      {state !== "future" && app.status_history && (() => {
                        const entry = app.status_history.find((h) => h.status === step.status);
                        return entry ? (
                          <p className="text-[10px] text-[#94A3B8] mt-1 flex items-center gap-1">
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
                <div className="w-7 h-7 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] flex items-center justify-center">
                  <FileText size={13} className="text-[#3B82F6]" />
                </div>
                <h3 className="text-[#333] font-black tracking-tight">Documents</h3>
              </div>
              <Link href="/student/documents">
                <Button size="sm" variant="outline">
                  Manage Docs
                </Button>
              </Link>
            </div>
            {app.documents && app.documents.length > 0 ? (
              <div className="space-y-2">
                {app.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />
                      <div>
                        <div className="text-[#333] text-sm font-semibold capitalize">
                          {doc.doc_type.replace(/_/g, " ")}
                        </div>
                        <div className="text-[#64748B] text-xs">{doc.filename}</div>
                      </div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-[#10B981] text-xs hover:text-[#059669] font-semibold">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#64748B] text-sm">No documents uploaded for this application yet.</p>
            )}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Consultant */}
          {app.consultant && (
            <GlassCard>
              <h3 className="text-[#333] font-black tracking-tight mb-4">Your Consultant</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[rgba(16,185,129,0.08)] rounded-2xl flex items-center justify-center border border-[rgba(16,185,129,0.15)]">
                  <span className="text-[#10B981] font-black text-sm">
                    {app.consultant.full_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-[#333] font-bold text-sm">{app.consultant.full_name}</div>
                  <div className="text-[#64748B] text-xs">{app.consultant.role_title ?? "Consultant"}</div>
                </div>
              </div>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">
                    <MessageCircle size={15} className="mr-2" /> WhatsApp
                  </Button>
                </a>
              )}
            </GlassCard>
          )}

          {/* Application Info */}
          <GlassCard>
            <h3 className="text-[#333] font-black tracking-tight mb-4">App Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Status</span>
                <StatusBadge status={app.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Created</span>
                <span className="text-[#333] font-semibold">
                  {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Last Updated</span>
                <span className="text-[#333] font-semibold">
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
