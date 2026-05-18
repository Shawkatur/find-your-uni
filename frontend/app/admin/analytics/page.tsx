"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, DollarSign, Globe, TrendingUp, Loader2 } from "lucide-react";
import adminApi from "@/lib/admin-api";
import { PageWrapper } from "@/components/layout/PageWrapper";

interface AnalyticsData {
  funnel: Record<string, number>;
  registrations_monthly: { month: string; count: number }[];
  demographics: { country: string; count: number }[];
  revenue: { total: number; transactions: number };
}

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  unverified: "Unverified",
  pre_evaluation: "Pre-Evaluation",
  docs_collection: "Docs Collection",
  applied: "Applied",
  offer_received: "Offer Received",
  conditional_offer: "Conditional Offer",
  visa_stage: "Visa Stage",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  junk: "Junk",
};

const FUNNEL_ORDER = [
  "lead", "unverified", "pre_evaluation", "docs_collection",
  "applied", "offer_received", "conditional_offer", "visa_stage", "enrolled",
];

function FunnelBar({ label, count, maxCount }: { label: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-600 w-28 text-right truncate">{label}</span>
      <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-slate-600">
          {count}
        </span>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await adminApi.get("/admin/analytics");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <PageWrapper title="Analytics">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      </PageWrapper>
    );
  }

  if (!data) return null;

  const funnelEntries = FUNNEL_ORDER
    .filter((s) => (data.funnel[s] ?? 0) > 0)
    .map((s) => ({ status: s, label: STATUS_LABELS[s] || s, count: data.funnel[s] ?? 0 }));
  const maxFunnelCount = Math.max(...funnelEntries.map((e) => e.count), 1);

  const maxMonthly = Math.max(...data.registrations_monthly.map((m) => m.count), 1);

  return (
    <PageWrapper title="Analytics" subtitle="Platform performance and growth metrics.">
      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total Applications</span>
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <BarChart3 size={16} className="text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-violet-600">
            {Object.values(data.funnel).reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Revenue</span>
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign size={16} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ৳{data.revenue.total.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">{data.revenue.transactions} transactions</p>
        </div>
        <div className="bg-card rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Enrolled</span>
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600">{data.funnel["enrolled"] ?? 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-card rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-violet-500" /> Pipeline Funnel
          </h3>
          <div className="space-y-2.5">
            {funnelEntries.map((e) => (
              <FunnelBar key={e.status} label={e.label} count={e.count} maxCount={maxFunnelCount} />
            ))}
          </div>
          {(data.funnel["rejected"] || data.funnel["junk"] || data.funnel["withdrawn"]) && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4">
              {data.funnel["rejected"] && (
                <span className="text-xs font-medium text-red-500">Rejected: {data.funnel["rejected"]}</span>
              )}
              {data.funnel["junk"] && (
                <span className="text-xs font-medium text-orange-500">Junk: {data.funnel["junk"]}</span>
              )}
              {data.funnel["withdrawn"] && (
                <span className="text-xs font-medium text-slate-400">Withdrawn: {data.funnel["withdrawn"]}</span>
              )}
            </div>
          )}
        </div>

        {/* Registrations Chart */}
        <div className="bg-card rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={14} className="text-emerald-500" /> Registrations (Last 12 Months)
          </h3>
          <div className="flex items-end gap-1 h-40">
            {data.registrations_monthly.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-500 font-semibold">{m.count}</span>
                <div
                  className="w-full bg-emerald-400 rounded-t-md transition-all duration-300 min-h-[4px]"
                  style={{ height: `${(m.count / maxMonthly) * 100}%` }}
                />
                <span className="text-[8px] text-slate-400 font-medium">
                  {m.month.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-card rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Globe size={14} className="text-blue-500" /> Top Countries
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {data.demographics.map((d, i) => (
              <div key={d.country} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-slate-700">{d.country}</p>
                <p className="text-lg font-black text-slate-900 mt-1">{d.count}</p>
                {i === 0 && <span className="text-[9px] text-emerald-600 font-semibold">#1</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
