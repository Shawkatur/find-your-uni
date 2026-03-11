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
  { value: "completed", label: "Completed" },
];

const activeStatuses: AppStatus[] = ["submitted", "under_review", "offer_received"];
const completedStatuses: AppStatus[] = ["enrolled", "rejected", "withdrawn"];

// Left-border accent color by status
function statusAccent(status: AppStatus): string {
  switch (status) {
    case "offer_received":
    case "enrolled":
      return "border-l-emerald-500";
    case "submitted":
    case "under_review":
      return "border-l-indigo-500";
    case "rejected":
    case "withdrawn":
      return "border-l-red-500/50";
    default:
      return "border-l-white/10";
  }
}

function statusDot(status: AppStatus): string {
  switch (status) {
    case "offer_received":
    case "enrolled":
      return "bg-emerald-400";
    case "submitted":
    case "under_review":
      return "bg-indigo-400";
    case "rejected":
    case "withdrawn":
      return "bg-red-400/60";
    default:
      return "bg-slate-600";
  }
}

export default function ApplicationsPage() {
  const [tab, setTab] = useState("all");

  const { data, isLoading } = useQuery<{ items: Application[] }>({
    queryKey: ["student-applications-list"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=50");
      return res.data;
    },
  });

  const all = data?.items ?? [];
  const filtered =
    tab === "all"
      ? all
      : tab === "active"
      ? all.filter((a) => activeStatuses.includes(a.status))
      : all.filter((a) => completedStatuses.includes(a.status));

  return (
    <PageWrapper title="Applications" subtitle="Track all your university applications.">
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-white/6 border border-white/8">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
            >
              {t.label}
              {t.value === "all" && all.length > 0 && (
                <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded-full font-bold">
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
          title="No applications found"
          description={
            tab === "all"
              ? "Run matchmaking to find universities and apply."
              : `No ${tab} applications.`
          }
          action={
            tab === "all"
              ? { label: "Run Match", onClick: () => (window.location.href = "/student/match") }
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
                    <div className="w-9 h-9 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-slate-400" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-white font-black text-sm tracking-tight truncate">
                        {app.university?.name ?? "University"}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mt-0.5">
                        {app.program?.name ?? "Program"}
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5">
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
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
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
