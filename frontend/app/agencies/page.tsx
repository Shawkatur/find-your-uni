"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Star, Building2, ExternalLink } from "lucide-react";
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
      const res = await api.get("/agencies");
      return res.data?.items ?? res.data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-[#64748B] hover:text-[#333] text-sm transition-colors">← Home</Link>
          <Link href="/auth/register/consultant">
            <Button size="sm">Join as Consultant</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[#333] mb-2">Verified Agencies</h1>
        <p className="text-[#64748B] mb-8">Connect with licensed education consultants.</p>

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
                  <div className="w-11 h-11 bg-[rgba(16,185,129,0.06)] rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-[#333] font-semibold">{agency.name}</h3>
                    {agency.city && <p className="text-[#64748B] text-xs">{agency.city}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-[#64748B] mb-4">
                  {(agency.avg_rating ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-[#D97706]">
                      <Star size={13} fill="currentColor" />
                      {agency.avg_rating!.toFixed(1)}
                      {(agency.review_count ?? 0) > 0 && <span className="text-[#94A3B8]">({agency.review_count})</span>}
                    </span>
                  )}
                </div>

                {agency.license_no && (
                  <p className="text-[#94A3B8] text-xs mb-4">License: {agency.license_no}</p>
                )}

                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center gap-1 text-[#10B981] hover:text-[#059669] text-sm transition-colors"
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
