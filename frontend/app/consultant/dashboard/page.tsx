"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileText, TrendingUp, CheckCircle, Users, Clock } from "lucide-react";
import api from "@/lib/api";
import type { Application } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ConsultantDashboard() {
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["consultant-applications"],
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

  const stats = {
    total: applications.length,
    active: applications.filter((a) => ["lead", "pre_evaluation", "docs_collection", "applied"].includes(a.status)).length,
    offers: applications.filter((a) => ["offer_received", "conditional_offer"].includes(a.status)).length,
    enrolled: applications.filter((a) => a.status === "enrolled").length,
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Active", value: stats.active, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
    { label: "Offers", value: stats.offers, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Enrolled", value: stats.enrolled, icon: Users, color: "text-purple-600 bg-purple-50" },
  ];

  const statusOrder = ["lead", "pre_evaluation", "docs_collection", "applied", "offer_received", "conditional_offer", "visa_stage", "enrolled", "rejected"];
  const statusCounts = statusOrder.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <PageWrapper title="Consultant Dashboard" subtitle="Manage your students' applications.">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.label} padding={false} className="p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold text-[#1E293B]">{card.value}</div>
              <div className="text-[#64748B] text-xs mt-1">{card.label}</div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <GlassCard>
          <h2 className="text-[#1E293B] font-semibold mb-4">Application Pipeline</h2>
          {isLoading ? <LoadingSpinner size="sm" /> : (
            <div className="space-y-3">
              {statusOrder.map((status) => (
                statusCounts[status] > 0 && (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(statusCounts[status] / Math.max(applications.length, 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#1E293B] font-semibold text-sm w-6 text-right">{statusCounts[status]}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent Applications */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#64748B]" />
              <h2 className="text-[#1E293B] font-semibold">Recent Applications</h2>
            </div>
            <Link href="/consultant/applications" className="text-emerald-600 text-sm font-medium hover:text-emerald-700">
              View all →
            </Link>
          </div>
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 8).map((app) => (
                <Link key={app.id} href={`/consultant/applications/${app.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="text-[#1E293B] text-sm font-medium">{app.student?.full_name ?? "Student"}</div>
                      <div className="text-[#64748B] text-xs mt-0.5">{app.university?.name}</div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
