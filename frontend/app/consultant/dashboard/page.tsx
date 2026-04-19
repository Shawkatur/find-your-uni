"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, Users, Clock, Inbox, ClipboardCopy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Application, ApplicationApiResponse, TrackingLink } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_PILL: Record<string, string> = {
  lead:              "bg-slate-100 text-slate-700",
  pre_evaluation:    "bg-blue-50 text-blue-700",
  docs_collection:   "bg-blue-50 text-blue-700",
  applied:           "bg-blue-50 text-blue-700",
  offer_received:    "bg-emerald-50 text-emerald-700",
  conditional_offer: "bg-emerald-50 text-emerald-700",
  visa_stage:        "bg-blue-50 text-blue-700",
  enrolled:          "bg-emerald-50 text-emerald-700",
  rejected:          "bg-rose-50 text-rose-700",
  withdrawn:         "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  pre_evaluation: "Pre-Eval",
  docs_collection: "Docs",
  applied: "Applied",
  offer_received: "Offer",
  conditional_offer: "Conditional",
  visa_stage: "Visa",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const APP_URL =
  (typeof window !== "undefined" ? window.location.origin : "") ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "";

function ShareInviteLink() {
  const [copied, setCopied] = useState(false);

  const { data: links, isLoading } = useQuery<TrackingLink[]>({
    queryKey: ["tracking-links"],
    queryFn: () => api.get("/tracking-links").then((r) => r.data),
  });

  const firstLink = links?.[0];
  const inviteUrl = firstLink
    ? `${APP_URL}/intake/${firstLink.code}`
    : null;

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!inviteUrl) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link2 size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Share Invite Link</h3>
        </div>
        <p className="text-slate-500 text-sm mb-3">
          Create a tracking link to start inviting students.
        </p>
        <Link
          href="/consultant/tracking"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Go to Tracking Links &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Link2 size={16} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">Share Invite Link</h3>
      </div>
      <p className="text-slate-500 text-xs mb-3">
        Send this link to students — they&apos;ll be automatically assigned to you when they register.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={inviteUrl}
          className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-mono truncate focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shrink-0"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <ClipboardCopy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-slate-400 text-xs">
          {firstLink?.name ? `Campaign: ${firstLink.name}` : `Code: ${firstLink?.code}`} · {firstLink?.clicks ?? 0} clicks
        </span>
        <Link
          href="/consultant/tracking"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Manage links
        </Link>
      </div>
    </div>
  );
}

export default function ConsultantDashboard() {
  const router = useRouter();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["consultant-applications"],
    queryFn: async () => {
      const res = await api.get("/applications?page_size=50");
      return (res.data || []).map((app: ApplicationApiResponse): Application => ({
        ...app,
        student: app.students ?? app.student,
        program: app.programs ?? app.program,
        university: app.programs?.universities ?? app.university,
      }));
    },
  });

  const stats = {
    total: applications.length,
    active: applications.filter((a) => ["lead", "pre_evaluation", "docs_collection", "applied"].includes(a.status)).length,
    offers: applications.filter((a) => ["offer_received", "conditional_offer"].includes(a.status)).length,
    enrolled: applications.filter((a) => a.status === "enrolled").length,
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Active", value: stats.active, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Offers", value: stats.offers, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Enrolled", value: stats.enrolled, icon: Users, color: "text-purple-600 bg-purple-50" },
  ];

  if (isLoading) {
    return (
      <PageWrapper title="Consultant Dashboard" subtitle="Manage your students' applications.">
        {/* KPI skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <Skeleton className="w-10 h-10 rounded-full mb-3" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        {/* Recent applications skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
              <div>
                <Skeleton className="h-4 w-32 mb-1.5" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Consultant Dashboard" subtitle="Manage your students' applications.">
      {/* Share Invite Link */}
      <ShareInviteLink />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md p-5"
            >
              <div className={`${card.color} p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <div className="text-3xl font-bold tracking-tighter text-slate-900">
                {card.value}
              </div>
              <div className="text-slate-500 text-xs mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Recent Applications
          </h2>
          <Link
            href="/consultant/applications"
            className="text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No applications found"
            description="Applications from your students will appear here."
            action={{ label: "View Applications", onClick: () => router.push("/consultant/applications") }}
          />
        ) : (
          <div>
            {applications.slice(0, 8).map((app) => (
              <Link key={app.id} href={`/consultant/applications/${app.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {app.student?.full_name ?? "Student"}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {app.university?.name}{app.program?.name ? ` · ${app.program.name}` : ""}
                    </div>
                  </div>
                  <span
                    className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${STATUS_PILL[app.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {STATUS_LABEL[app.status] ?? app.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
