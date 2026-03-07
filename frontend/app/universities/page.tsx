"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Building2, Star, DollarSign, Filter } from "lucide-react";
import api from "@/lib/api";
import type { University } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { GlassCard } from "@/components/layout/GlassCard";
import Providers from "@/components/Providers";

function UniversitiesList() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);

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
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0F172A]/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
          <Link href="/auth/login">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Universities</h1>
        <p className="text-slate-400 mb-8">{total > 0 ? `${total} universities found` : "Search our global database"}</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search universities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-white/8 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Filter by country..."
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="pl-9 bg-white/8 border-white/10 text-white placeholder:text-slate-500 w-48"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading universities..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {universities.map((uni) => (
              <Link key={uni.id} href={`/universities/${uni.id}`}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                      <Building2 size={20} className="text-blue-400" />
                    </div>
                    {uni.qs_rank && (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                        <Star size={10} className="mr-1" /> QS #{uni.qs_rank}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-white font-semibold mb-1 line-clamp-2">{uni.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{uni.city ? `${uni.city}, ` : ""}{uni.country}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/8 pt-3">
                    {uni.annual_tuition_usd ? (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        ${uni.annual_tuition_usd.toLocaleString()}/yr
                      </span>
                    ) : <span />}
                    {uni.acceptance_rate && (
                      <span className="text-green-400">{uni.acceptance_rate}% acceptance</span>
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
              className="border-white/10 text-slate-300 hover:bg-white/8"
            >
              Previous
            </Button>
            <span className="flex items-center text-slate-400 text-sm px-3">
              Page {page} of {Math.ceil(total / 12)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 12)}
              onClick={() => setPage(p => p + 1)}
              className="border-white/10 text-slate-300 hover:bg-white/8"
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
