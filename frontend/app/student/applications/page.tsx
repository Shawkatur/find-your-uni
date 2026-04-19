"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileText, Building2, ChevronRight, ClipboardCheck, FolderOpen, Send, Trophy } from "lucide-react";
import api from "@/lib/api";
import type { Application, ApplicationApiResponse, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Done" },
];

const activeStatuses: AppStatus[] = ["lead", "pre_evaluation", "docs_collection", "applied", "offer_received", "conditional_offer", "visa_stage"];
const completedStatuses: AppStatus[] = ["enrolled", "rejected", "withdrawn"];

// 4-step linear tracker
const TRACKER_STEPS = [
  {
    key: "review",
    label: "Under Review",
    icon: ClipboardCheck,
    statuses: ["lead", "pre_evaluation"] as AppStatus[],
  },
  {
    key: "docs",
    label: "Docs Needed",
    icon: FolderOpen,
    statuses: ["docs_collection"] as AppStatus[],
  },
  {
    key: "applied",
    label: "Applied",
    icon: Send,
    statuses: ["applied"] as AppStatus[],
  },
  {
    key: "decision",
    label: "Decision",
    icon: Trophy,
    statuses: ["offer_received", "conditional_offer", "visa_stage", "enrolled"] as AppStatus[],
  },
];

function getTrackerIndex(status: AppStatus): number {
  for (let i = 0; i < TRACKER_STEPS.length; i++) {
    if (TRACKER_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

function getMicroCopy(status: AppStatus): string {
  switch (status) {
    case "lead":
    case "pre_evaluation":
      return "Your consultant is currently reviewing your profile to assess your chances.";
    case "docs_collection":
      return "Time to gather your documents! Check your Documents page for what's needed.";
    case "applied":
      return "Your application has been submitted. We're waiting to hear back from the university.";
    case "offer_received":
    case "conditional_offer":
      return "Great news! You've received an offer. Review the details with your consultant.";
    case "visa_stage":
      return "Your visa process is underway. Stay in touch with your consultant for updates.";
    case "enrolled":
      return "Congratulations! You're officially enrolled. Welcome to your new university!";
    case "rejected":
      return "Unfortunately this application wasn't successful. Your consultant can help explore other options.";
    case "withdrawn":
      return "This application was withdrawn. Reach out to your consultant if you have questions.";
    default:
      return "Your application is being processed.";
  }
}

const TERMINAL_STATUSES: AppStatus[] = ["rejected", "withdrawn"];

export default function ApplicationsPage() {
  const [tab, setTab] = useState("all");

  const { data: all = [], isLoading } = useQuery<Application[]>({
    queryKey: ["student-applications-list"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=50");
      return (res.data || []).map((app: ApplicationApiResponse): Application => ({
        ...app,
        student: app.students ?? app.student,
        program: app.programs ?? app.program,
        university: app.programs?.universities ?? app.university,
      }));
    },
  });

  const filtered =
    tab === "all"
      ? all
      : tab === "active"
      ? all.filter((a) => activeStatuses.includes(a.status))
      : all.filter((a) => completedStatuses.includes(a.status));

  return (
    <PageWrapper title="Applications" subtitle="Track every application in one place.">
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-500 rounded-lg"
            >
              {t.label}
              {t.value === "all" && all.length > 0 && (
                <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                  {all.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description={
            tab === "all"
              ? "Find your top universities and start applying. We'll track everything for you here."
              : `No ${tab} applications right now.`
          }
          action={
            tab === "all"
              ? { label: "Start Exploring Universities", onClick: () => (window.location.href = "/student/match") }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const currentStep = getTrackerIndex(app.status);
            const isTerminal = TERMINAL_STATUSES.includes(app.status);

            return (
              <Link key={app.id} href={`/student/applications/${app.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 p-5 cursor-pointer group">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-slate-900 font-semibold text-sm truncate group-hover:text-emerald-600 transition-colors">
                          {app.university?.name ?? "University"}
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {app.program?.name ?? "Program"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 ml-4" />
                  </div>

                  {/* Mini Stepper */}
                  {isTerminal ? (
                    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      app.status === "enrolled"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {app.status === "enrolled" ? "Enrolled" : app.status === "rejected" ? "Application Unsuccessful" : "Withdrawn"}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {TRACKER_STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isCurrent = i === currentStep;
                        const isDone = i < currentStep;

                        return (
                          <div key={step.key} className="flex items-center flex-1 min-w-0">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors w-full justify-center ${
                              isCurrent
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isDone
                                ? "bg-emerald-50/50 text-emerald-600"
                                : "bg-slate-50 text-slate-400"
                            }`}>
                              <StepIcon size={12} className="shrink-0" />
                              <span className="truncate hidden sm:inline">{step.label}</span>
                            </div>
                            {i < TRACKER_STEPS.length - 1 && (
                              <div className={`w-4 h-0.5 shrink-0 mx-0.5 rounded-full ${
                                i < currentStep ? "bg-emerald-300" : "bg-slate-200"
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Micro-copy */}
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                    {getMicroCopy(app.status)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
