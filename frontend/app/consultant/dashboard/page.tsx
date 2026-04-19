"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, Users, Clock, Inbox } from "lucide-react";
import api from "@/lib/api";
import type { Application, ApplicationApiResponse } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_PILL: Record<string, string> = {
  lead:              "bg-slate-100 text-slate-700",
  pre_evaluation:    "bg-blue-50 text-blue-700",
  docs_collection:   "bg-blue-50 text-blue-700",
  applied:           "bg-blue-50 text-blue-700",
  offer_received:    "bg-emerald-50 text-emerald-700",
  conditional_offer: "bg-emerald-50 text-emerald-700",
  visa_stage:        "bg-blue-50 text-blue-700",
  enrolled:          "bg-emerald-50 text-emerald-700",
  rejected:          "bg-rose-50 text-rose-700",
  withdrawn:         "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  pre_evaluation: "Pre-Eval",
  docs_collection: "Docs",
  applied: "Applied",
  offer_received: "Offer",
  conditional_offer: "Conditional",
  visa_stage: "Visa",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function ConsultantDashboard() {
  const router = useRouter();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["consultant-applications"],
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

  const stats = {
    total: applications.length,
    active: applications.filter((a) => ["lead", "pre_evaluation", "docs_collection", "applied"].includes(a.status)).length,
    offers: applications.filter((a) => ["offer_received", "conditional_offer"].includes(a.status)).length,
    enrolled: applications.filter((a) => a.status === "enrolled").length,
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Active", value: stats.active, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Offers", value: stats.offers, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Enrolled", value: stats.enrolled, icon: Users, color: "text-purple-600 bg-purple-50" },
  ];

  if (isLoading) {
    return (
      <PageWrapper title="Consultant Dashboard" subtitle="Manage your students' applications.">
        {/* KPI skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <Skeleton className="w-10 h-10 rounded-full mb-3" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        {/* Recent applications skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
              <div>
                <Skeleton className="h-4 w-32 mb-1.5" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Consultant Dashboard" subtitle="Manage your students' applications.">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md p-5"
            >
              <div className={`${card.color} p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <div className="text-3xl font-bold tracking-tighter text-slate-900">
                {card.value}
              </div>
              <div className="text-slate-500 text-xs mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Recent Applications
          </h2>
          <Link
            href="/consultant/applications"
            className="text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No applications found"
            description="Applications from your students will appear here."
            action={{ label: "View Applications", onClick: () => router.push("/consultant/applications") }}
          />
        ) : (
          <div>
            {applications.slice(0, 8).map((app) => (
              <Link key={app.id} href={`/consultant/applications/${app.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {app.student?.full_name ?? "Student"}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {app.university?.name}{app.program?.name ? ` · ${app.program.name}` : ""}
                    </div>
                  </div>
                  <span
                    className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${STATUS_PILL[app.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {STATUS_LABEL[app.status] ?? app.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
