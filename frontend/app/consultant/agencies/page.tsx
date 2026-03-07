"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, Users, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import type { Agency, Consultant } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ConsultantAgenciesPage() {
  const { data: agencyData, isLoading: agencyLoading } = useQuery<Agency>({
    queryKey: ["my-agency"],
    queryFn: async () => {
      const res = await api.get("/consultants/me/agency");
      return res.data;
    },
  });

  const { data: colleagues = [], isLoading: colleaguesLoading } = useQuery<Consultant[]>({
    queryKey: ["agency-colleagues"],
    queryFn: async () => {
      const res = await api.get("/consultants/me/colleagues");
      return res.data?.items ?? res.data ?? [];
    },
  });

  if (agencyLoading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <PageWrapper title="Agencies" subtitle="Your agency and team information.">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agency Card */}
        <div className="lg:col-span-1">
          <GlassCard>
            {agencyData ? (
              <>
                <h2 className="text-white font-bold text-lg mb-1">{agencyData.name}</h2>
                <p className="text-slate-400 text-sm mb-4">{agencyData.city ? `${agencyData.city}, ` : ""}{agencyData.country}</p>

                {agencyData.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-yellow-400" fill="currentColor" />
                    <span className="text-white font-semibold">{agencyData.rating.toFixed(1)}</span>
                    {agencyData.review_count && (
                      <span className="text-slate-400 text-sm">({agencyData.review_count} reviews)</span>
                    )}
                  </div>
                )}

                {agencyData.consultant_count && (
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-slate-300 text-sm">{agencyData.consultant_count} consultants</span>
                  </div>
                )}

                {agencyData.license_no && (
                  <p className="text-slate-500 text-xs">License: {agencyData.license_no}</p>
                )}

                {agencyData.website && (
                  <a
                    href={agencyData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors"
                  >
                    <ExternalLink size={13} /> Website
                  </a>
                )}
              </>
            ) : (
              <div className="text-slate-400 text-sm">No agency assigned. Contact your administrator.</div>
            )}
          </GlassCard>
        </div>

        {/* Colleagues */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h2 className="text-white font-semibold mb-4">Team Members</h2>
            {colleaguesLoading ? (
              <LoadingSpinner size="sm" />
            ) : colleagues.length === 0 ? (
              <p className="text-slate-400 text-sm">No other consultants in this agency.</p>
            ) : (
              <div className="space-y-3">
                {colleagues.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-white/4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-purple-400 font-semibold text-sm">
                        {c.full_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{c.full_name}</div>
                      <div className="text-slate-400 text-xs">{c.role_title ?? "Consultant"}</div>
                    </div>
                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
