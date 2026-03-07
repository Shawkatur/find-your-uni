"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileText } from "lucide-react";
import api from "@/lib/api";
import type { Application, AppStatus } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
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
  const filtered = tab === "all" ? all
    : tab === "active" ? all.filter((a) => activeStatuses.includes(a.status))
    : all.filter((a) => completedStatuses.includes(a.status));

  return (
    <PageWrapper title="Applications" subtitle="Track all your university applications.">
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-white/8 border border-white/10">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
            >
              {t.label}
              {t.value === "all" && all.length > 0 && (
                <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{all.length}</span>
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
          description={tab === "all" ? "Run matchmaking to find universities and apply." : `No ${tab} applications.`}
          action={tab === "all" ? { label: "Run Match", onClick: () => window.location.href = "/student/match" } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link key={app.id} href={`/student/applications/${app.id}`}>
              <GlassCard hover padding={false} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium text-sm">{app.university?.name ?? "University"}</h3>
                    </div>
                    <p className="text-slate-400 text-xs">{app.program?.name ?? "Program"}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Updated {new Date(app.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <StatusBadge status={app.status} />
                    <span className="text-slate-500 text-sm">→</span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
