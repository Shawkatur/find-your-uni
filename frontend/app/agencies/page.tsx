"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Star, Users, Building2, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import type { Agency } from "@/types";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/layout/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import Providers from "@/components/Providers";

function AgencyList() {
  const { data: agencies = [], isLoading } = useQuery<Agency[]>({
    queryKey: ["agencies"],
    queryFn: async () => {
      const res = await api.get("/consultants/agencies");
      return res.data?.items ?? res.data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← Home</Link>
          <Link href="/auth/register/consultant">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Join as Consultant</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Verified Agencies</h1>
        <p className="text-slate-400 mb-8">Connect with licensed education consultants to guide your journey.</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading agencies..." />
          </div>
        ) : agencies.length === 0 ? (
          <EmptyState icon={Building2} title="No agencies listed yet" description="Check back soon." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agencies.map((agency) => (
              <GlassCard key={agency.id} hover className="flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 bg-purple-600/10 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{agency.name}</h3>
                    <p className="text-slate-400 text-xs">{agency.city ? `${agency.city}, ` : ""}{agency.country}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  {agency.rating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star size={13} fill="currentColor" />
                      {agency.rating.toFixed(1)}
                      {agency.review_count && <span className="text-slate-500">({agency.review_count})</span>}
                    </span>
                  )}
                  {agency.consultant_count && (
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {agency.consultant_count} consultants
                    </span>
                  )}
                </div>

                {agency.license_no && (
                  <p className="text-slate-500 text-xs mb-4">License: {agency.license_no}</p>
                )}

                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    <ExternalLink size={13} /> Visit Website
                  </a>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgenciesPage() {
  return (
    <Providers>
      <AgencyList />
    </Providers>
  );
}
