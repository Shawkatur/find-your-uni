"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Plus, X, Trophy, DollarSign, Globe, GraduationCap, BarChart3 } from "lucide-react";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";

interface ShortlistItem {
  id: string;
  university_id: string;
  tuition_fee: number | null;
  currency: string | null;
  living_expense: number | null;
  program_name: string | null;
  university: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    ranking_qs: number | null;
    tuition_usd_per_year: number | null;
    scholarships_available: boolean | null;
    max_scholarship_pct: number | null;
    min_ielts: number | null;
    min_gpa_percentage: number | null;
    acceptance_rate_bd: number | null;
  } | null;
}

function CompareRow({ label, icon, values, highlight }: {
  label: string;
  icon: React.ReactNode;
  values: (string | null)[];
  highlight?: "lowest" | "highest";
}) {
  const numericValues = values.map((v) => (v ? parseFloat(v.replace(/[^0-9.]/g, "")) : null));
  let bestIdx = -1;
  if (highlight && numericValues.some((v) => v !== null)) {
    const valid = numericValues.map((v, i) => v !== null ? { v, i } : null).filter(Boolean) as { v: number; i: number }[];
    if (valid.length > 0) {
      bestIdx = highlight === "lowest"
        ? valid.reduce((a, b) => a.v <= b.v ? a : b).i
        : valid.reduce((a, b) => a.v >= b.v ? a : b).i;
    }
  }

  return (
    <tr className="border-b border-slate-100">
      <td className="py-3 px-4 text-sm font-medium text-slate-600 flex items-center gap-2">
        {icon} {label}
      </td>
      {values.map((val, i) => (
        <td key={i} className={`py-3 px-4 text-sm text-center ${i === bestIdx ? "text-emerald-600 font-semibold bg-emerald-50/50" : "text-slate-700"}`}>
          {val || "—"}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: items = [], isLoading } = useQuery<ShortlistItem[]>({
    queryKey: ["shortlist"],
    queryFn: async () => {
      const res = await api.get("/shortlist");
      return res.data;
    },
  });

  const selected = items.filter((item) => selectedIds.includes(item.university_id));
  const available = items.filter((item) => !selectedIds.includes(item.university_id));

  if (isLoading) {
    return <PageWrapper title="Compare Universities"><LoadingSpinner /></PageWrapper>;
  }

  return (
    <PageWrapper
      title="Compare Universities"
      subtitle="Side-by-side comparison of your shortlisted universities"
    >
      <div className="mb-4">
        <Link href="/student/shortlist" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to shortlist
        </Link>
      </div>

      {/* Selector */}
      {selected.length < 4 && available.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-2">Add a university to compare ({selected.length}/4)</p>
          <div className="flex flex-wrap gap-2">
            {available.map((item) => (
              <button
                key={item.university_id}
                onClick={() => setSelectedIds([...selectedIds, item.university_id])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
              >
                <Plus size={12} /> {item.university?.name || "Unknown"}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BarChart3 size={48} className="mx-auto mb-3" />
          <p className="text-lg font-medium">Select universities to compare</p>
          <p className="text-sm mt-1">Choose 2–4 universities from your shortlist above</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase w-40">Metric</th>
                {selected.map((item) => (
                  <th key={item.university_id} className="py-3 px-4 text-center min-w-[160px]">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                        {item.university?.name || "Unknown"}
                      </span>
                      <button
                        onClick={() => setSelectedIds(selectedIds.filter((id) => id !== item.university_id))}
                        className="text-slate-300 hover:text-red-500 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.university?.country}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="QS Ranking"
                icon={<Trophy size={14} className="text-amber-500" />}
                values={selected.map((s) => s.university?.ranking_qs ? `#${s.university.ranking_qs}` : null)}
                highlight="lowest"
              />
              <CompareRow
                label="Tuition (USD/yr)"
                icon={<DollarSign size={14} className="text-emerald-500" />}
                values={selected.map((s) => s.university?.tuition_usd_per_year ? `$${s.university.tuition_usd_per_year.toLocaleString()}` : null)}
                highlight="lowest"
              />
              <CompareRow
                label="Acceptance Rate (BD)"
                icon={<BarChart3 size={14} className="text-blue-500" />}
                values={selected.map((s) => s.university?.acceptance_rate_bd ? `${s.university.acceptance_rate_bd}%` : null)}
                highlight="highest"
              />
              <CompareRow
                label="Min IELTS"
                icon={<Globe size={14} className="text-purple-500" />}
                values={selected.map((s) => s.university?.min_ielts?.toString() ?? null)}
                highlight="lowest"
              />
              <CompareRow
                label="Min GPA (%)"
                icon={<GraduationCap size={14} className="text-indigo-500" />}
                values={selected.map((s) => s.university?.min_gpa_percentage ? `${s.university.min_gpa_percentage}%` : null)}
                highlight="lowest"
              />
              <CompareRow
                label="Scholarships"
                icon={<DollarSign size={14} className="text-yellow-500" />}
                values={selected.map((s) => {
                  if (!s.university?.scholarships_available) return "No";
                  return s.university.max_scholarship_pct ? `Up to ${s.university.max_scholarship_pct}%` : "Yes";
                })}
              />
              <CompareRow
                label="City"
                icon={<Globe size={14} className="text-slate-400" />}
                values={selected.map((s) => s.university?.city ?? null)}
              />
              <CompareRow
                label="Program"
                icon={<GraduationCap size={14} className="text-slate-400" />}
                values={selected.map((s) => s.program_name ?? null)}
              />
            </tbody>
          </table>
        </div>
      )}

      {items.length < 2 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          <p>Add at least 2 universities to your <Link href="/student/shortlist" className="text-emerald-600 underline">shortlist</Link> to compare them.</p>
        </div>
      )}
    </PageWrapper>
  );
}
