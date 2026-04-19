"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Star, Filter, LayoutDashboard, MapPin, DollarSign, BarChart3 } from "lucide-react";
import api from "@/lib/api";
import type { University } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 sticky top-0 z-30 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {user ? (
            <Link
              href={`/${profile?.role === "consultant" ? "consultant" : "student"}/dashboard`}
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard size={14} /> Back to Dashboard
            </Link>
          ) : (
            <Link href="/" className="text-slate-500 hover:text-slate-900 text-sm transition-colors">
              ← Back to Home
            </Link>
          )}
          {user ? (
            <span className="text-slate-500 text-sm font-medium">
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Unis</h1>
        <p className="text-slate-500 mb-8">{total > 0 ? `${total} universities found` : "Search our global database"}</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search universities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl h-11 focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Filter by country..."
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="pl-9 w-full sm:w-48 bg-slate-50 border-slate-200 rounded-xl h-11 focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden h-full flex flex-col group">
                  {/* Campus Cover Image Placeholder */}
                  <div className="relative h-[120px] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-slate-300 flex flex-col items-center gap-1">
                        <MapPin size={24} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          {uni.country}
                        </span>
                      </div>
                    </div>

                    {/* QS Ranking badge floating over image */}
                    {uni.ranking_qs && (
                      <Badge className="absolute top-3 right-3 bg-amber-50 text-amber-700 border border-amber-200 shadow-sm text-xs font-semibold">
                        <Star size={10} className="mr-1 fill-amber-400 text-amber-400" /> QS #{uni.ranking_qs}
                      </Badge>
                    )}

                    {/* Shortlist button */}
                    <div className="absolute top-3 left-3">
                      <ShortlistButton universityId={uni.id} size="sm" />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {uni.name}
                    </h3>
                    <p className="text-slate-500 text-xs mb-4 flex items-center gap-1">
                      <MapPin size={11} />
                      {uni.city ? `${uni.city}, ` : ""}{uni.country}
                    </p>

                    {/* Soft pills at bottom */}
                    <div className="mt-auto flex flex-wrap gap-2">
                      {uni.tuition_usd_per_year && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          <DollarSign size={11} />
                          ${uni.tuition_usd_per_year.toLocaleString()}/yr
                        </span>
                      )}
                      {uni.acceptance_rate_overall && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                          <BarChart3 size={11} />
                          {uni.acceptance_rate_overall}% acceptance
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="flex items-center text-slate-500 text-sm px-3">
              Page {page} of {Math.ceil(total / 12)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 12)}
              onClick={() => setPage(p => p + 1)}
              className="rounded-xl"
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
