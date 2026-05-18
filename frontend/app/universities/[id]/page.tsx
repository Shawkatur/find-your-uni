"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, Star, DollarSign, Globe, MapPin, ArrowRight, LayoutDashboard } from "lucide-react";
import api from "@/lib/api";
import type { University } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/layout/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Providers from "@/components/Providers";
import { useAuth } from "@/hooks/useAuth";
import { ShortlistButton } from "@/components/shortlist/ShortlistButton";

function UniversityDetailContent() {
  const { id } = useParams();
  const { user, profile } = useAuth();

  const { data: uni, isLoading } = useQuery<University>({
    queryKey: ["university", id],
    queryFn: async () => {
      const res = await api.get(`/universities/${id}`);
      return res.data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!uni) return <div className="text-center py-20 text-muted-foreground">University not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/90 sticky top-0 z-30 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/universities" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            ← Back to Unis
          </Link>
          {user ? (
            <Link
              href={`/${profile?.role === "consultant" ? "consultant" : "student"}/dashboard`}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          ) : (
            <Link href="/auth/register/student">
              <Button size="sm">Apply Now <ArrowRight size={14} className="ml-1" /></Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-16 h-16 bg-[rgba(16,185,129,0.06)] rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={28} className="text-[#10B981]" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">{uni.name}</h1>
              <ShortlistButton universityId={uni.id} />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin size={14} /> {uni.city ? `${uni.city}, ` : ""}{uni.country}
              </span>
              {uni.ranking_qs && (
                <Badge variant="outline" className="border-[#FDE68A] text-[#D97706] bg-[#FFFBEB]">
                  <Star size={10} className="mr-1" /> QS Rank #{uni.ranking_qs}
                </Badge>
              )}
              {uni.scholarships_available && (
                <Badge variant="outline" className="border-[rgba(16,185,129,0.2)] text-[#059669] bg-[rgba(16,185,129,0.05)]">
                  Scholarships Available
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {uni.tuition_usd_per_year && (
            <GlassCard padding={false} className="p-5 text-center">
              <DollarSign size={20} className="text-[#3B82F6] mx-auto mb-2" />
              <div className="text-xl font-bold text-foreground">${uni.tuition_usd_per_year.toLocaleString()}</div>
              <div className="text-muted-foreground text-xs mt-1">Annual Tuition (USD)</div>
            </GlassCard>
          )}
          {uni.acceptance_rate_overall && (
            <GlassCard padding={false} className="p-5 text-center">
              <Star size={20} className="text-[#10B981] mx-auto mb-2" />
              <div className="text-xl font-bold text-foreground">{uni.acceptance_rate_overall}%</div>
              <div className="text-muted-foreground text-xs mt-1">Acceptance Rate</div>
            </GlassCard>
          )}
          {uni.acceptance_rate_bd && (
            <GlassCard padding={false} className="p-5 text-center">
              <Globe size={20} className="text-[#8B5CF6] mx-auto mb-2" />
              <div className="text-xl font-bold text-foreground">{uni.acceptance_rate_bd}%</div>
              <div className="text-muted-foreground text-xs mt-1">BD Student Acceptance</div>
            </GlassCard>
          )}
        </div>

        {/* Requirements */}
        {(uni.min_ielts || uni.min_toefl || uni.min_gpa_percentage) && (
          <GlassCard className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Minimum Requirements</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {uni.min_ielts && (
                <div>
                  <div className="text-muted-foreground text-xs mb-1">IELTS</div>
                  <div className="text-foreground font-semibold">{uni.min_ielts}+</div>
                </div>
              )}
              {uni.min_toefl && (
                <div>
                  <div className="text-muted-foreground text-xs mb-1">TOEFL</div>
                  <div className="text-foreground font-semibold">{uni.min_toefl}+</div>
                </div>
              )}
              {uni.min_gpa_percentage && (
                <div>
                  <div className="text-muted-foreground text-xs mb-1">GPA</div>
                  <div className="text-foreground font-semibold">{uni.min_gpa_percentage}+</div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Programs */}
        {uni.programs && uni.programs.length > 0 && (
          <GlassCard className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Programs</h2>
            <div className="space-y-3">
              {uni.programs.map((prog) => (
                <div key={prog.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] hover:bg-secondary transition-colors">
                  <div>
                    <div className="text-foreground font-medium text-sm">{prog.name}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {prog.degree_level} · {prog.field}
                      {prog.duration_years && ` · ${prog.duration_years} yr`}
                    </div>
                  </div>
                  <div className="text-right">
                    {prog.annual_tuition_usd && (
                      <div className="text-secondary-foreground text-sm">${prog.annual_tuition_usd.toLocaleString()}/yr</div>
                    )}
                    {prog.application_deadline && (
                      <div className="text-muted-foreground text-xs">Deadline: {new Date(prog.application_deadline).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Description */}
        {uni.description && (
          <GlassCard className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{uni.description}</p>
          </GlassCard>
        )}

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Want to apply to {uni.name}?</p>
          {user ? (
            <Link href="/student/applications">
              <Button className="px-8 py-3">
                View My Applications <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register/student">
              <Button className="px-8 py-3">
                Create Account & Apply <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UniversityDetailPage() {
  return (
    <Providers>
      <UniversityDetailContent />
    </Providers>
  );
}
