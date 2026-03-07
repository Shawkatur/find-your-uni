"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { University } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function AdminUniversitiesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ items: University[]; total: number }>({
    queryKey: ["admin-universities", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: "15" });
      if (search) params.set("search", search);
      const res = await api.get(`/universities?${params}`);
      return res.data;
    },
  });

  const universities = data?.items ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/universities/${id}`);
    },
    onSuccess: () => {
      toast.success("University deleted.");
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete."),
  });

  return (
    <PageWrapper
      title="Universities"
      subtitle={`${total} universities in the database`}
      actions={
        <Link href="/admin/universities/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={15} className="mr-2" /> Add University
          </Button>
        </Link>
      }
    >
      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name or country..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 bg-white/8 border-white/10 text-white placeholder:text-slate-500 max-w-md"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : (
        <GlassCard padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Name", "Country", "QS Rank", "Tuition/yr", "Programs", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {universities.map((uni) => (
                  <tr key={uni.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-white font-medium text-sm">{uni.name}</div>
                      {uni.city && <div className="text-slate-500 text-xs">{uni.city}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm">{uni.country}</td>
                    <td className="px-5 py-3">
                      {uni.qs_rank ? (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10 text-xs">
                          #{uni.qs_rank}
                        </Badge>
                      ) : <span className="text-slate-600 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm">
                      {uni.annual_tuition_usd ? `$${uni.annual_tuition_usd.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm">
                      {uni.programs?.length ?? 0}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/universities/${uni.id}`}>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/8 p-1.5 h-auto">
                            <Pencil size={13} />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(uni.id)}
                          className="text-red-400 hover:bg-red-500/10 p-1.5 h-auto"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
              <span className="text-slate-400 text-sm">
                {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="border-white/10 text-slate-300 hover:bg-white/8">Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}
                  className="border-white/10 text-slate-300 hover:bg-white/8">Next</Button>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete University"
        description="This will permanently delete the university and all associated programs. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </PageWrapper>
  );
}
