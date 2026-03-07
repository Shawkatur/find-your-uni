"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, FileText, Users } from "lucide-react";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AdminStats {
  universities: number;
  programs: number;
  students: number;
  applications: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
  });

  const cards = [
    { label: "Universities", value: stats?.universities ?? 0, icon: Building2, color: "text-blue-400 bg-blue-600/10" },
    { label: "Programs", value: stats?.programs ?? 0, icon: GraduationCap, color: "text-purple-400 bg-purple-600/10" },
    { label: "Students", value: stats?.students ?? 0, icon: Users, color: "text-green-400 bg-green-600/10" },
    { label: "Applications", value: stats?.applications ?? 0, icon: FileText, color: "text-yellow-400 bg-yellow-600/10" },
  ];

  return (
    <PageWrapper title="Admin Dashboard" subtitle="Platform overview and statistics.">
      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <GlassCard key={card.label} padding={false} className="p-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${card.color}`}>
                  <Icon size={22} />
                </div>
                <div className="text-3xl font-bold text-white">{card.value.toLocaleString()}</div>
                <div className="text-slate-400 text-sm mt-1">{card.label}</div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
