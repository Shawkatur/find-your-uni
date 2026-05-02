"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import {
  Sparkles, FileText, ArrowRight,
  CheckCircle2, Clock, Send, Trophy,
  User, Upload,
  GraduationCap, ThumbsUp, X, Building2,
  MessageCircle, BookOpen, Globe, PenLine,
  Lock,
} from "lucide-react";
import api from "@/lib/api";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Application, ApplicationApiResponse, Document as DocType, Student, Recommendation } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Concierge Stepper ──────────────────────────────────────────────────────

interface StepState {
  profileComplete: boolean;
  documentsUploaded: boolean;
  hasRecommendations: boolean;
}

function ConciergeProgress({ steps }: { steps: StepState }) {
  const items = [
    {
      key: "profile",
      label: "Complete Profile",
      done: steps.profileComplete,
      href: "/student/profile",
      icon: User,
    },
    {
      key: "documents",
      label: "Upload Documents",
      done: steps.documentsUploaded,
      href: "/student/documents",
      icon: Upload,
    },
    {
      key: "review",
      label: "Expert Review",
      done: steps.hasRecommendations,
      href: "",
      icon: Lock,
      locked: true,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const pct = Math.round((completedCount / items.length) * 100);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-slate-900 font-bold text-base">Your Progress</h2>
          <p className="text-slate-500 text-xs mt-0.5">{completedCount}/{items.length} steps completed</p>
        </div>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
          pct === 100 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
        }`}>
          {pct}%
        </span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((step, idx) => {
          const Icon = step.icon;
          const isNext = !step.done && items.slice(0, idx).every((s) => s.done);
          const isLocked = step.locked && !step.done && !isNext;

          const content = (
            <div className={`
              group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200
              ${step.done
                ? "bg-slate-50/50 border-slate-200 opacity-70"
                : isNext
                  ? "bg-white border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }
            `}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                step.done ? "bg-emerald-50" : isNext ? "bg-emerald-50" : "bg-slate-100"
              }`}>
                {step.done ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Icon size={16} className={isNext ? "text-emerald-600" : "text-slate-400"} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${
                    step.done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"
                  }`}>{step.label}</h3>
                  {isNext && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Next</span>
                  )}
                  {isLocked && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Waiting</span>
                  )}
                </div>
              </div>
            </div>
          );

          if (step.href && !step.locked) {
            return <Link key={step.key} href={step.href}>{content}</Link>;
          }
          return <div key={step.key}>{content}</div>;
        })}
      </div>
    </div>
  );
}

// ─── Wait State Hero + Preparation Hub ──────────────────────────────────────

const GUIDES = [
  {
    title: "How to prepare for your student visa interview",
    desc: "Essential tips and common questions to help you ace your visa interview with confidence.",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Understanding the cost of living in Canada & the UK",
    desc: "A practical breakdown of housing, food, transport, and monthly budgets for international students.",
    icon: Globe,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Crafting the perfect Statement of Purpose (SOP)",
    desc: "Step-by-step guide to writing an SOP that stands out to admissions committees.",
    icon: PenLine,
    color: "bg-violet-50 text-violet-600",
  },
];

function WaitStateHero() {
  return (
    <>
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center mb-8">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
            <Clock size={24} className="text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Your file is under expert review</h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
          Our education consultants are currently evaluating your academic background.
          We will prepare a highly curated list of universities tailored to your goals within the next <strong className="text-slate-700">48 hours</strong>.
        </p>
      </div>

      {/* Preparation Hub */}
      <div className="mb-8">
        <h3 className="text-slate-900 font-bold text-base mb-4">Essential Guides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <div
                key={guide.title}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${guide.color}`}>
                  <Icon size={18} />
                </div>
                <h4 className="text-slate-900 font-semibold text-sm mb-1.5 leading-snug">{guide.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{guide.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Recommendations Widget ─────────────────────────────────────────────────

function RecommendationsWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["pending-recommendations"],
    queryFn: async () => {
      const res = await api.get("/recommendations?status=pending");
      return res.data ?? [];
    },
    enabled: !!user,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const res = await api.patch(`/recommendations/${id}/review`, { status });
      return res.data;
    },
    onMutate: async ({ id }) => {
      setDismissedIds((prev) => new Set(prev).add(id));
    },
    onSuccess: (_data, { status }) => {
      if (status === "approved") {
        toast.success("Application started — your consultant will take it from here");
        qc.invalidateQueries({ queryKey: ["student-applications"] });
      } else {
        toast.success("Recommendation declined");
      }
      qc.invalidateQueries({ queryKey: ["pending-recommendations"] });
    },
    onError: (_err, { id }) => {
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error("Failed to update recommendation");
    },
  });

  const visible = recommendations.filter((r) => !dismissedIds.has(r.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Sparkles size={15} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-slate-900 font-bold text-sm">Consultant Recommendations</h2>
          <p className="text-slate-500 text-xs">
            Your consultant recommended {visible.length} program{visible.length !== 1 ? "s" : ""} for you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((rec) => {
          const prog = rec.programs;
          const uni = prog?.universities;
          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-slate-900 font-semibold text-sm leading-snug line-clamp-2">
                    {prog?.name ?? "Program"}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    {uni?.name ?? "University"}
                    {uni?.country ? ` · ${uni.country}` : ""}
                  </p>
                  {prog?.degree_level && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
                      {prog.degree_level}
                    </span>
                  )}
                </div>
              </div>

              {rec.consultants?.full_name && (
                <p className="text-slate-400 text-xs mb-2">
                  Recommended by <span className="font-medium text-slate-600">{rec.consultants.full_name}</span>
                </p>
              )}

              {rec.notes && (
                <p className="text-slate-500 text-xs italic border-l-2 border-indigo-200 pl-2 mb-4 line-clamp-3">
                  {rec.notes}
                </p>
              )}

              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  onClick={() => reviewMutation.mutate({ id: rec.id, status: "approved" })}
                  disabled={reviewMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ThumbsUp size={13} className="mr-1.5" />
                  Approve & Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reviewMutation.mutate({ id: rec.id, status: "rejected" })}
                  disabled={reviewMutation.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <X size={13} className="mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat Widget ────────────────────────────────────────────────────────────

interface Message {
  id: string;
  student_id: string;
  consultant_id: string;
  sender_type: "student" | "consultant";
  content: string;
  is_read: boolean;
  created_at: string;
}

function ChatWidget({ consultantName }: { consultantName: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: messages = [], refetch } = useQuery<Message[]>({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data ?? [];
    },
    enabled: !!user,
    refetchInterval: open ? 5000 : false,
  });

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => { refetch(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post("/messages", { content });
    },
    onSuccess: () => {
      setText("");
      refetch();
    },
    onError: () => toast.error("Failed to send message"),
  });

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }

  const unreadCount = messages.filter((m) => m.sender_type === "consultant" && !m.is_read).length;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        <MessageCircle size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-5 py-4 border-b border-slate-200">
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                <GraduationCap size={14} className="text-emerald-600" />
              </div>
              {consultantName}
            </SheetTitle>
          </SheetHeader>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">No messages yet. Say hello!</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_type === "student";
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-900 rounded-bl-md"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 px-4 py-3 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 w-10 p-0"
            >
              <Send size={15} />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user, profile } = useAuth();

  // Student profile
  const { data: student } = useQuery<Student>({
    queryKey: ["student-me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data?.profile ?? res.data;
    },
    enabled: !!user,
  });

  // Documents
  const { data: documents = [] } = useQuery<DocType[]>({
    queryKey: ["student-documents"],
    queryFn: async () => {
      const res = await api.get("/documents");
      return res.data?.items ?? res.data ?? [];
    },
    enabled: !!user,
  });

  // Applications
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
    enabled: !!user,
  });

  // All recommendations (any status)
  const { data: allRecommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["all-recommendations"],
    queryFn: async () => {
      const res = await api.get("/recommendations");
      return res.data ?? [];
    },
    enabled: !!user,
  });

  // Consultant info
  const { data: consultantInfo } = useQuery<{ assigned: boolean; consultant?: { id: string; full_name: string } }>({
    queryKey: ["consultant-info"],
    queryFn: async () => {
      const res = await api.get("/messages/consultant-info");
      return res.data;
    },
    enabled: !!user,
  });

  // ─── Derived state ───────────────────────────────────────────────────────

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const profileComplete = !!(
    student?.full_name &&
    (student as unknown as Record<string, unknown>)?.academic_history
  );

  const requiredDocTypes = ["passport", "transcript", "sop", "lor", "cv"];
  const uploadedTypes = new Set(documents.map((d) => d.doc_type));
  const documentsUploaded = requiredDocTypes.every((t) => uploadedTypes.has(t as DocType["doc_type" & string]));

  const hasRecommendations = allRecommendations.length > 0;
  const isWaitState = profileComplete && documentsUploaded && !hasRecommendations;
  const isUnlocked = hasRecommendations;

  const HIDDEN_STATUSES = ["lead"];
  const visibleApplications = applications.filter((a) => !HIDDEN_STATUSES.includes(a.status));
  const visibleStatusCounts = Object.fromEntries(
    Object.entries(
      applications.reduce<Record<string, number>>((acc, app) => {
        acc[app.status] = (acc[app.status] ?? 0) + 1;
        return acc;
      }, {})
    ).filter(([s]) => !HIDDEN_STATUSES.includes(s))
  );

  const activeCount =
    (visibleStatusCounts["pre_evaluation"] ?? 0) +
    (visibleStatusCounts["docs_collection"] ?? 0) +
    (visibleStatusCounts["applied"] ?? 0);
  const offerCount =
    (visibleStatusCounts["offer_received"] ?? 0) +
    (visibleStatusCounts["conditional_offer"] ?? 0);

  const steps: StepState = { profileComplete, documentsUploaded, hasRecommendations };

  return (
    <PageWrapper>
      {/* Welcome */}
      <div className="mb-6">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Student Portal</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Hey {firstName}, <span className="text-emerald-500">let&apos;s find your uni</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Your journey to the right university starts here.</p>
      </div>

      {/* Stats Row — only show when unlocked */}
      {isUnlocked && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Send size={13} className="text-emerald-600" />
              </div>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Applied</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{visibleApplications.length}</div>
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
      )}

      {/* Recommendations — top of page when unlocked */}
      {isUnlocked && <RecommendationsWidget />}

      {/* Concierge Progress Stepper */}
      <ConciergeProgress steps={steps} />

      {/* Wait State: Hero + Preparation Hub */}
      {isWaitState && <WaitStateHero />}

      {/* Bottom grid: Applications + Recent Activity — only when unlocked */}
      {isUnlocked && (
        <>
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText size={15} className="text-emerald-600" />
                </div>
                <h2 className="text-slate-900 font-bold text-sm">Applications</h2>
              </div>
              {visibleApplications.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Your applications will appear here once your consultant starts processing them.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(visibleStatusCounts).map(([status, count]) => (
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

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <CheckCircle2 size={15} className="text-slate-500" />
                </div>
                <h2 className="text-slate-900 font-bold text-sm">Recent Activity</h2>
              </div>
              {visibleApplications.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No activity yet.</p>
              ) : (
                <div className="space-y-1">
                  {visibleApplications.slice(0, 5).map((app) => (
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
              )}
            </div>
          </div>
        </>
      )}

      {/* Chat Widget — only when consultant is assigned */}
      {consultantInfo?.assigned && consultantInfo.consultant && (
        <ChatWidget consultantName={consultantInfo.consultant.full_name} />
      )}
    </PageWrapper>
  );
}
