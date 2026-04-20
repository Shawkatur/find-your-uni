"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, FileText, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import adminApi from "@/lib/admin-api";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function AdminDashboardPage() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await adminApi.get("/admin/stats");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      </PageWrapper>
    );
  }

  const cards = [
    { label: "Total Students", value: stats?.total_students ?? 0, icon: GraduationCap, color: "emerald" },
    { label: "Total Consultants", value: stats?.total_consultants ?? 0, icon: Users, color: "blue" },
    { label: "Applications", value: stats?.total_applications ?? 0, icon: FileText, color: "violet" },
    {
      label: "Pending Verifications",
      value: stats?.pending_consultant_approvals ?? 0,
      icon: ShieldCheck,
      color: "amber",
      onClick: () => router.push("/admin/verifications"),
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-600" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600", text: "text-violet-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-600" },
  };

  return (
    <PageWrapper title="Admin Dashboard" subtitle="Platform overview and management.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const c = colorMap[card.color];
          return (
            <div
              key={card.label}
              onClick={card.onClick}
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${card.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className={c.icon} />
                </div>
              </div>
              <p className={`text-2xl font-black ${c.text}`}>{card.value}</p>
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
}
