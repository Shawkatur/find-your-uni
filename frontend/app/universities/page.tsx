"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Building2, Star, DollarSign, Filter, LayoutDashboard } from "lucide-react";
import api from "@/lib/api";
import type { University } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { GlassCard } from "@/components/layout/GlassCard";
import Providers from "@/components/Providers";
import { useAuth } from "@/hooks/useAuth";
import { ShortlistButton } from "@/components/shortlist/ShortlistButton";

function UniversitiesList() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const { user, profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["universities", search, country, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: "12" });
      if (search) params.set("search", search);
      if (country) params.set("country", country);
      const res = await api.get(`/universities?${params}`);
      return res.data;
    },
  });

  const universities: University[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] bg-white/90 sticky top-0 z-30 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {user ? (
            <Link
              href={`/${profile?.role === "consultant" ? "consultant" : "student"}/dashboard`}
              className="text-[#64748B] hover:text-[#333] text-sm transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard size={14} /> Back to Dashboard
            </Link>
          ) : (
            <Link href="/" className="text-[#64748B] hover:text-[#333] text-sm transition-colors">
              ← Back to Home
            </Link>
          )}
          {user ? (
            <span className="text-[#64748B] text-sm font-medium">
              {profile?.full_name ?? user.email?.split("@")[0]}
            </span>
          ) : (
            <Link href="/auth/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[#333] mb-2">Browse Unis</h1>
        <p className="text-[#64748B] mb-8">{total > 0 ? `${total} unis found` : "Search our global database"}</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <Input
              placeholder="Search universities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <Input
              placeholder="Filter by country..."
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="pl-9 w-full sm:w-48"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading unis..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {universities.map((uni) => (
              <Link key={uni.id} href={`/universities/${uni.id}`}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[rgba(16,185,129,0.06)] rounded-xl flex items-center justify-center">
                      <Building2 size={20} className="text-[#10B981]" />
                    </div>
                    <div className="flex items-center gap-2">
                      {uni.ranking_qs && (
                        <Badge variant="outline" className="border-[#FDE68A] text-[#D97706] bg-[#FFFBEB]">
                          <Star size={10} className="mr-1" /> QS #{uni.ranking_qs}
                        </Badge>
                      )}
                      <ShortlistButton universityId={uni.id} size="sm" />
                    </div>
                  </div>

                  <h3 className="text-[#333] font-semibold mb-1 line-clamp-2">{uni.name}</h3>
                  <p className="text-[#64748B] text-sm mb-4">{uni.city ? `${uni.city}, ` : ""}{uni.country}</p>

                  <div className="flex items-center justify-between text-xs text-[#64748B] border-t border-[#E2E8F0] pt-3">
                    {uni.tuition_usd_per_year ? (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        ${uni.tuition_usd_per_year.toLocaleString()}/yr
                      </span>
                    ) : <span />}
                    {uni.acceptance_rate_overall && (
                      <span className="text-[#059669]">{uni.acceptance_rate_overall}% acceptance</span>
                    )}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="flex justify-center gap-3 mt-10">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center text-[#64748B] text-sm px-3">
              Page {page} of {Math.ceil(total / 12)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 12)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <Providers>
      <UniversitiesList />
    </Providers>
  );
}
