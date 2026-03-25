"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileText, ArrowRight, Building2 } from "lucide-react";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

// Left-border accent color by status
function statusAccent(status: AppStatus): string {
  switch (status) {
    case "offer_received":
    case "conditional_offer":
    case "enrolled":
      return "border-l-[#10B981]";
    case "visa_stage":
      return "border-l-[#8B5CF6]";
    case "lead":
    case "pre_evaluation":
    case "docs_collection":
    case "applied":
      return "border-l-[#3B82F6]";
    case "rejected":
    case "withdrawn":
      return "border-l-red-300";
    default:
      return "border-l-[#E2E8F0]";
  }
}

function statusDot(status: AppStatus): string {
  switch (status) {
    case "offer_received":
    case "conditional_offer":
    case "enrolled":
      return "bg-[#10B981]";
    case "visa_stage":
      return "bg-[#8B5CF6]";
    case "lead":
    case "pre_evaluation":
    case "docs_collection":
    case "applied":
      return "bg-[#3B82F6]";
    case "rejected":
    case "withdrawn":
      return "bg-red-400";
    default:
      return "bg-[#CBD5E1]";
  }
}

export default function ApplicationsPage() {
  const [tab, setTab] = useState("all");

  const { data: all = [], isLoading } = useQuery<Application[]>({
    queryKey: ["student-applications-list"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=50");
      return (res.data || []).map((app: Record<string, unknown>) => ({
        ...app,
        student: app.students ?? app.student,
        program: app.programs ?? app.program,
        university: (app.programs as Record<string, unknown>)?.universities ?? app.university,
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
    <PageWrapper title="Applications" subtitle="All your apps in one place.">
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0]">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-[#10B981] data-[state=active]:text-white text-[#64748B]"
            >
              {t.label}
              {t.value === "all" && all.length > 0 && (
                <span className="ml-1.5 text-xs bg-[rgba(16,185,129,0.15)] px-1.5 py-0.5 rounded-full font-bold">
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
          title="Nothing here yet"
          description={
            tab === "all"
              ? "Find your top unis and start applying."
              : `No ${tab} applications.`
          }
          action={
            tab === "all"
              ? { label: "Find Matches", onClick: () => (window.location.href = "/student/match") }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link key={app.id} href={`/student/applications/${app.id}`}>
              <div
                className={`glass-card glass-card-hover border-l-4 ${statusAccent(app.status)} p-5 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(app.status)}`} />

                    {/* University icon */}
                    <div className="w-9 h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-[#64748B]" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-[#333] font-black text-sm tracking-tight truncate">
                        {app.university?.name ?? "University"}
                      </h3>
                      <p className="text-[#64748B] text-xs font-medium mt-0.5">
                        {app.program?.name ?? "Program"}
                      </p>
                      <p className="text-[#94A3B8] text-xs mt-0.5">
                        Updated{" "}
                        {new Date(app.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <StatusBadge status={app.status} />
                    <ArrowRight size={14} className="text-[#94A3B8] group-hover:text-[#10B981] transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
