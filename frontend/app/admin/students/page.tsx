"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Student {
  id: string;
  full_name: string;
  phone: string;
  preferred_countries: string[] | null;
  degree_level: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

interface PaginatedStudents {
  items: Student[];
  total: number;
  page: number;
  page_size: number;
}

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__studentSearchTimer);
    (window as any).__studentSearchTimer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const { data, isLoading } = useQuery<PaginatedStudents>({
    queryKey: ["admin-students", debouncedSearch, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return api.get(`/admin/students?${params}`).then((r) => r.data);
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <PageWrapper
      title="Students"
      subtitle={data ? `${data.total} total students` : "All registered students"}
    >
      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
        />
      </div>

      <GlassCard>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
            <Users size={40} />
            <p>{debouncedSearch ? "No students match your search." : "No students yet."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Preferred Countries</th>
                  <th className="pb-3 pr-4 font-medium">Degree</th>
                  <th className="pb-3 font-medium">Onboarding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.items.map((student) => (
                  <tr key={student.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{student.full_name}</td>
                    <td className="py-3 pr-4 text-slate-300">{student.phone}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {student.preferred_countries?.slice(0, 3).map((c) => (
                          <Badge key={c} variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-xs">
                            {c}
                          </Badge>
                        ))}
                        {(student.preferred_countries?.length ?? 0) > 3 && (
                          <Badge variant="secondary" className="bg-white/10 text-slate-400 text-xs">
                            +{(student.preferred_countries?.length ?? 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-300 capitalize">{student.degree_level ?? "—"}</td>
                    <td className="py-3">
                      <Badge
                        variant={student.onboarding_completed ? "default" : "secondary"}
                        className={student.onboarding_completed
                          ? "bg-green-600/20 text-green-300 border-green-500/30"
                          : "bg-yellow-600/20 text-yellow-300 border-yellow-500/30"}
                      >
                        {student.onboarding_completed ? "Complete" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <span className="text-slate-400 text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-white/10 text-slate-300 hover:bg-white/10"
              >
                <ChevronLeft size={15} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-white/10 text-slate-300 hover:bg-white/10"
              >
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </PageWrapper>
  );
}
