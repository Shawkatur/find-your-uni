"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, FileText, ArrowRight,
  TrendingUp, CheckCircle2, Clock, Send, Trophy,
  User, Upload, CircleDashed,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Application, ApplicationApiResponse, MatchResultItem, Document as DocType, Student } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

// ─── Onboarding Checklist Config ─────────────────────────────────────────────
interface ChecklistStep {
  key: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
  icon: typeof User;
}

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    key: "profile",
    title: "Complete Your Profile",
    desc: "Add your academic background, test scores, and preferences for accurate matching.",
    cta: "Complete Profile",
    href: "/student/profile",
    icon: User,
  },
  {
    key: "documents",
    title: "Upload Documents",
    desc: "Upload your passport, transcripts, SOP, and other required documents.",
    cta: "Upload Documents",
    href: "/student/documents",
    icon: Upload,
  },
  {
    key: "match",
    title: "Run AI Matching",
    desc: "Let our AI rank the best-fit universities based on your complete profile.",
    cta: "Find Matches",
    href: "/student/match",
    icon: Sparkles,
  },
  {
    key: "shortlist",
    title: "Save Universities",
    desc: "Browse your matches and shortlist the ones you're most interested in.",
    cta: "Browse Universities",
    href: "/universities",
    icon: TrendingUp,
  },
  {
    key: "apply",
    title: "Apply to Universities",
    desc: "Start applications to your shortlisted universities and track progress.",
    cta: "View Applications",
    href: "/student/applications",
    icon: Send,
  },
  {
    key: "offer",
    title: "Get Your Offer",
    desc: "Receive offers and work with your consultant on visa and enrollment.",
    cta: "View Applications",
    href: "/student/applications",
    icon: Trophy,
  },
];

function useOnboardingState() {
  const { data: student } = useQuery<Student>({
    queryKey: ["student-me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data?.profile ?? res.data;
    },
  });

  const { data: documents = [] } = useQuery<DocType[]>({
    queryKey: ["student-documents"],
    queryFn: async () => {
      const res = await api.get("/documents");
      return res.data?.items ?? res.data ?? [];
    },
  });

  const { data: matchResults = [] } = useQuery<MatchResultItem[]>({
    queryKey: ["match-results-preview"],
    queryFn: async () => {
      try {
        const res = await api.get("/match/results");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["student-applications"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=20");
      return (res.data || []).map((app: ApplicationApiResponse): Application => ({
        ...app,
        student: app.students ?? app.student,
        program: app.programs ?? app.program,
        university: app.programs?.universities ?? app.university,
      }));
    },
  });

  // Determine completion of each step
  const hasProfile = !!(
    student?.full_name &&
    (student as unknown as Record<string, unknown>)?.academic_history
  );

  const requiredDocTypes = ["passport", "transcript", "sop", "lor", "cv"];
  const uploadedTypes = new Set(documents.map((d) => d.doc_type));
  const hasDocs = requiredDocTypes.every((t) => uploadedTypes.has(t as DocType["doc_type" & string]));

  const hasMatches = matchResults.length > 0;
  const hasApplications = applications.length > 0;

  const statusCounts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});
  const offerCount = (statusCounts["offer_received"] ?? 0) + (statusCounts["conditional_offer"] ?? 0);
  const hasOffer = offerCount > 0;

  const completed: Record<string, boolean> = {
    profile: hasProfile,
    documents: hasDocs,
    match: hasMatches,
    shortlist: hasMatches, // if they ran matching, shortlisting is available
    apply: hasApplications,
    offer: hasOffer,
  };

  return { completed, applications, matchResults, statusCounts, offerCount, documents };
}

function OnboardingChecklist({ completed }: { completed: Record<string, boolean> }) {
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPct = Math.round((completedCount / CHECKLIST_STEPS.length) * 100);

  // Find first incomplete step
  const nextStepKey = CHECKLIST_STEPS.find((s) => !completed[s.key])?.key;

  return (
    <div className="mb-8">
      {/* Checklist header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-slate-900 font-bold text-base">Your Progress</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {completedCount}/{CHECKLIST_STEPS.length} steps completed
          </p>
        </div>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
          progressPct === 100
            ? "bg-emerald-50 text-emerald-600"
            : "bg-slate-100 text-slate-600"
        }`}>
          {progressPct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Checklist grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CHECKLIST_STEPS.map((step) => {
          const Icon = step.icon;
          const isDone = completed[step.key];
          const isNext = step.key === nextStepKey;

          return (
            <Link
              key={step.key}
              href={step.href}
              className={`
                group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200
                ${isDone
                  ? "bg-slate-50/50 border-slate-200 opacity-70"
                  : isNext
                    ? "bg-white border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }
              `}
            >
              {/* Step icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDone
                  ? "bg-emerald-50"
                  : isNext
                    ? "bg-emerald-50"
                    : "bg-slate-50"
              }`}>
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Icon size={16} className={isNext ? "text-emerald-600" : "text-slate-400"} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${
                    isDone
                      ? "text-slate-500 line-through decoration-slate-300"
                      : "text-slate-900"
                  }`}>
                    {step.title}
                  </h3>
                  {isNext && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      Next
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{step.desc}</p>

                {!isDone && (
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${
                    isNext ? "text-emerald-600" : "text-slate-500"
                  } group-hover:text-emerald-600 transition-colors`}>
                    {step.cta}
                    <ArrowRight size={11} />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const { completed, applications, matchResults, statusCounts, offerCount } = useOnboardingState();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const activeCount =
    (statusCounts["lead"] ?? 0) + (statusCounts["pre_evaluation"] ?? 0) +
    (statusCounts["docs_collection"] ?? 0) + (statusCounts["applied"] ?? 0);
  const topMatches = matchResults.slice(0, 3);

  return (
    <PageWrapper>
      {/* Welcome */}
      <div className="mb-6">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">
          Student Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Hey {firstName}, <span className="text-emerald-500">let&apos;s find your uni</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Your journey to the right university starts here.
        </p>
      </div>

      {/* Stats Row — first thing returning students see */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Send size={13} className="text-emerald-600" />
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Applied</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{applications.length}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock size={13} className="text-blue-600" />
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">In Review</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Trophy size={13} className="text-emerald-600" />
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Offers</span>
          </div>
          <div className={`text-2xl font-bold ${offerCount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
            {offerCount}
          </div>
        </div>
      </div>

      {/* Dynamic Onboarding Checklist */}
      <OnboardingChecklist completed={completed} />

      {/* Bottom grid: Applications + Top Matches */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Application Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileText size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-slate-900 font-bold text-sm">Applications</h2>
          </div>
          {applications.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="No applications yet"
              description="Start applying to track your progress here."
              action={{ label: "Find Matches", onClick: () => router.push("/student/match") }}
              className="py-6 border-0"
            />
          ) : (
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <StatusBadge status={status} />
                  <span className="text-slate-900 font-bold text-sm">{count}</span>
                </div>
              ))}
              <Link
                href="/student/applications"
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-semibold pt-2 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Top Match Results */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp size={15} className="text-amber-600" />
              </div>
              <h2 className="text-slate-900 font-bold text-sm">Top Matches</h2>
            </div>
            <Link
              href="/student/match"
              className="text-emerald-600 text-xs hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {topMatches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="Run matching to see your top universities ranked by fit."
              action={{ label: "Find Matches", onClick: () => router.push("/student/match") }}
              className="py-6 border-0"
            />
          ) : (
            <div className="space-y-2.5">
              {topMatches.map((result) => {
                const pct = Math.round(result.score * 100);
                const isHigh = pct >= 80;
                return (
                  <div
                    key={`${result.university_id}-${result.program_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${
                        isHigh
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <span className={`font-bold text-sm leading-none ${
                        isHigh ? "text-emerald-600" : "text-blue-600"
                      }`}>
                        {pct}%
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">fit</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 font-semibold text-sm truncate">
                        {result.university_name}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {result.program_name} &middot; {result.country}
                      </div>
                    </div>
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          isHigh
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                            : "bg-gradient-to-r from-blue-400 to-blue-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {applications.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <CheckCircle2 size={15} className="text-slate-500" />
              </div>
              <h2 className="text-slate-900 font-bold text-sm">Recent Activity</h2>
            </div>
            <Link
              href="/student/applications"
              className="text-emerald-600 text-xs hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {applications.slice(0, 5).map((app) => (
              <Link key={app.id} href={`/student/applications/${app.id}`}>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div>
                    <div className="text-slate-900 text-sm font-semibold group-hover:text-emerald-600 transition-colors">
                      {app.university?.name ?? "University"}
                    </div>
                    <div className="text-slate-500 text-xs">{app.program?.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
