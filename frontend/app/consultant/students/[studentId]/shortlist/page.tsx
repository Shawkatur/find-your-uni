"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bookmark,
  Building2,
  DollarSign,
  Star,
  X,
  BadgeCheck,
  UserCheck,
  Plus,
  Search,
  ArrowLeft,
  GraduationCap,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  PenLine,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import type { Recommendation } from "@/types";
import { GlassCard } from "@/components/layout/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Sidebar } from "@/components/layout/Sidebar";
import Providers from "@/components/Providers";

interface ShortlistItem {
  id: string;
  university_id: string;
  added_by_role: "student" | "consultant";
  note: string | null;
  added_at: string;
  tuition_fee: number | null;
  currency: string | null;
  living_expense: number | null;
  is_manual_entry: boolean;
  program_name: string | null;
  university: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    ranking_qs: number | null;
    tuition_usd_per_year: number | null;
    scholarships_available: boolean | null;
    max_scholarship_pct: number | null;
    min_ielts: number | null;
    min_gpa_percentage: number | null;
    acceptance_rate_bd: number | null;
  } | null;
}

interface UniSearchResult {
  id: string;
  name: string;
  country: string;
  city: string | null;
  ranking_qs: number | null;
  programs?: ProgramResult[];
}

interface ProgramResult {
  id: string;
  name: string;
  degree_level: string;
  field: string;
  tuition_usd_per_year: number | null;
  is_active: boolean;
}

const REC_STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-200 text-amber-700 bg-amber-50",
  approved: "border-emerald-200 text-emerald-700 bg-emerald-50",
  rejected: "border-red-200 text-red-700 bg-red-50",
};

function ConsultantStudentShortlistContent() {
  const { studentId } = useParams<{ studentId: string }>();
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  // Manual entry state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "", country: "", city: "", program_name: "",
    tuition_fee: "", currency: "USD", living_expense: "",
    note: "",
  });

  // Recommend modal state
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recSearch, setRecSearch] = useState("");
  const [selectedUni, setSelectedUni] = useState<UniSearchResult | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [recNotes, setRecNotes] = useState("");

  // ─── Shortlist queries ────────────────────────────────────────────────────

  const { data: items = [], isLoading } = useQuery<ShortlistItem[]>({
    queryKey: ["student-shortlist", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/shortlist`);
      return res.data;
    },
    enabled: !!studentId,
  });

  const { data: searchResults = [] } = useQuery<UniSearchResult[]>({
    queryKey: ["uni-search", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const res = await api.get(`/universities?search=${encodeURIComponent(search)}&page_size=8`);
      return res.data?.items ?? [];
    },
    enabled: search.length >= 2,
  });

  const removeMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await api.delete(`/students/${studentId}/shortlist/${universityId}`);
    },
    onSuccess: () => {
      toast.success("Removed from shortlist");
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: () => toast.error("Failed to remove"),
  });

  const addMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await api.post(`/students/${studentId}/shortlist`, { university_id: universityId });
    },
    onSuccess: () => {
      toast.success("Added to student's shortlist");
      setShowAddModal(false);
      setSearch("");
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.info("Already in shortlist");
      else toast.error("Failed to add");
    },
  });

  const manualAddMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await api.post(`/students/${studentId}/shortlist/manual`, body);
    },
    onSuccess: () => {
      toast.success("University added to shortlist");
      setShowAddModal(false);
      setShowManualForm(false);
      setManualForm({ name: "", country: "", city: "", program_name: "", tuition_fee: "", currency: "USD", living_expense: "", note: "" });
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: () => toast.error("Failed to add university"),
  });

  function handleManualSubmit() {
    if (!manualForm.name || !manualForm.country) return;
    const body: Record<string, unknown> = {
      name: manualForm.name,
      country: manualForm.country,
      currency: manualForm.currency,
    };
    if (manualForm.city) body.city = manualForm.city;
    if (manualForm.program_name) body.program_name = manualForm.program_name;
    if (manualForm.tuition_fee) body.tuition_fee = parseFloat(manualForm.tuition_fee);
    if (manualForm.living_expense) body.living_expense = parseFloat(manualForm.living_expense);
    if (manualForm.note) body.note = manualForm.note;
    manualAddMutation.mutate(body);
  }

  // ─── Recommendation queries ───────────────────────────────────────────────

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["student-recommendations", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/recommendations`);
      return res.data;
    },
    enabled: !!studentId,
  });

  const { data: recSearchResults = [] } = useQuery<UniSearchResult[]>({
    queryKey: ["uni-search-rec", recSearch],
    queryFn: async () => {
      if (recSearch.length < 2) return [];
      const res = await api.get(`/universities?search=${encodeURIComponent(recSearch)}&page_size=8`);
      return res.data?.items ?? [];
    },
    enabled: recSearch.length >= 2,
  });

  const recommendMutation = useMutation({
    mutationFn: async (body: { program_id: string; notes: string | null }) => {
      await api.post(`/students/${studentId}/recommendations`, body);
    },
    onSuccess: () => {
      toast.success("Program recommended");
      resetRecommendModal();
      qc.invalidateQueries({ queryKey: ["student-recommendations", studentId] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.info("This program was already recommended");
      else toast.error("Failed to recommend");
    },
  });

  function resetRecommendModal() {
    setShowRecommendModal(false);
    setRecSearch("");
    setSelectedUni(null);
    setSelectedProgramId("");
    setRecNotes("");
  }

  function handleSubmitRecommendation() {
    if (!selectedProgramId) return;
    recommendMutation.mutate({
      program_id: selectedProgramId,
      notes: recNotes.trim() || null,
    });
  }

  const activePrograms = (selectedUni?.programs ?? []).filter((p) => p.is_active !== false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role="consultant" />
      <main className="flex-1 md:ml-64 p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/consultant/applications"
            className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#1E293B] text-sm transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Applications
          </Link>
          <div className="flex items-center gap-3">
            <Bookmark size={20} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-[#1E293B]">Student Shortlist</h1>
          </div>
          <p className="text-[#64748B] text-sm mt-1">
            {items.length > 0
              ? (
                <>
                  {items.length} saved universit{items.length === 1 ? "y" : "ies"}
                  {" · "}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add another
                  </button>
                </>
              )
              : "No universities saved for this student yet"}
          </p>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#1E293B] font-semibold">Search & Add University</h3>
              <button
                onClick={() => { setShowAddModal(false); setSearch(""); }}
                className="text-[#64748B] hover:text-[#1E293B]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <Input
                placeholder="Search universities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-slate-50 border-slate-200 text-[#1E293B] placeholder:text-[#64748B]"
                autoFocus
              />
            </div>
            {search.length >= 2 && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((uni) => (
                  <div
                    key={uni.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="text-[#1E293B] text-sm font-medium">{uni.name}</div>
                      <div className="text-[#64748B] text-xs">
                        {uni.city ? `${uni.city}, ` : ""}
                        {uni.country}
                        {uni.ranking_qs ? ` · QS #${uni.ranking_qs}` : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addMutation.mutate(uni.id)}
                      disabled={addMutation.isPending}
                      className="border-slate-200 text-[#64748B] hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Plus size={13} className="mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {search.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <p className="text-[#64748B] text-sm">No universities found for &ldquo;{search}&rdquo;</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setManualForm((f) => ({ ...f, name: search }));
                    setShowManualForm(true);
                  }}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <PenLine size={13} className="mr-1.5" /> Can&apos;t find it? Add manually
                </Button>
              </div>
            )}
          </GlassCard>
        )}

        {/* Manual University Entry Dialog */}
        <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenLine size={16} className="text-blue-600" />
                Add University Manually
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-[#64748B]">University Name *</Label>
                  <Input
                    value={manualForm.name}
                    onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. University of Toronto"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#64748B]">Country *</Label>
                  <Input
                    value={manualForm.country}
                    onChange={(e) => setManualForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="e.g. Canada"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#64748B]">City</Label>
                  <Input
                    value={manualForm.city}
                    onChange={(e) => setManualForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Toronto"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#64748B]">Program Name</Label>
                <Input
                  value={manualForm.program_name}
                  onChange={(e) => setManualForm((f) => ({ ...f, program_name: e.target.value }))}
                  placeholder="e.g. MSc Computer Science"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-[#64748B]">Tuition Fee</Label>
                  <Input
                    type="number"
                    value={manualForm.tuition_fee}
                    onChange={(e) => setManualForm((f) => ({ ...f, tuition_fee: e.target.value }))}
                    placeholder="25000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#64748B]">Currency</Label>
                  <Select
                    value={manualForm.currency}
                    onValueChange={(val) => setManualForm((f) => ({ ...f, currency: val ?? "USD" }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="BDT">BDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#64748B]">Monthly Living Cost</Label>
                  <Input
                    type="number"
                    value={manualForm.living_expense}
                    onChange={(e) => setManualForm((f) => ({ ...f, living_expense: e.target.value }))}
                    placeholder="1500"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#64748B]">Consultant Notes</Label>
                <Textarea
                  value={manualForm.note}
                  onChange={(e) => setManualForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Any notes about this university..."
                  rows={2}
                  className="mt-1 resize-none"
                />
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={!manualForm.name || !manualForm.country || manualAddMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={14} className="mr-1.5" />
                {manualAddMutation.isPending ? "Adding..." : "Add to Shortlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Shortlist Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading shortlist..." />
          </div>
        ) : items.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Bookmark size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-[#64748B] text-sm mb-4">No universities saved yet</p>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={14} className="mr-1.5" /> Add First University
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((item) => {
              const uni = item.university;
              if (!uni) return null;
              return (
                <GlassCard key={item.id} className="relative group">
                  <button
                    onClick={() => removeMutation.mutate(item.university_id)}
                    disabled={removeMutation.isPending}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from shortlist"
                  >
                    <X size={14} />
                  </button>

                  <Link href={`/universities/${uni.id}`} className="block">
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[#1E293B] font-semibold text-sm leading-snug line-clamp-2">
                          {uni.name}
                        </h3>
                        <p className="text-[#64748B] text-xs mt-0.5">
                          {uni.city ? `${uni.city}, ` : ""}
                          {uni.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {uni.ranking_qs && (
                        <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50 text-[10px]">
                          <Star size={9} className="mr-1" /> QS #{uni.ranking_qs}
                        </Badge>
                      )}
                      {uni.scholarships_available && (
                        <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 text-[10px]">
                          <BadgeCheck size={9} className="mr-1" />
                          Scholarships
                          {uni.max_scholarship_pct ? ` up to ${uni.max_scholarship_pct}%` : ""}
                        </Badge>
                      )}
                      {item.added_by_role === "consultant" && (
                        <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50 text-[10px]">
                          <UserCheck size={9} className="mr-1" /> By Consultant
                        </Badge>
                      )}
                      {item.is_manual_entry && (
                        <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50 text-[10px]">
                          <PenLine size={9} className="mr-1" /> Manual Entry
                        </Badge>
                      )}
                    </div>

                    {item.program_name && (
                      <p className="text-[#1E293B] text-xs font-medium mb-2">
                        <GraduationCap size={11} className="inline mr-1 text-indigo-500" />
                        {item.program_name}
                      </p>
                    )}

                    {/* Financial details from manual entry */}
                    {(item.tuition_fee || item.living_expense) && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.tuition_fee && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <Wallet size={9} />
                            Est. Tuition: {item.currency ?? "USD"} {item.tuition_fee.toLocaleString()}/yr
                          </span>
                        )}
                        {item.living_expense && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                            <DollarSign size={9} />
                            Living: {item.currency ?? "USD"} {item.living_expense.toLocaleString()}/mo
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-3">
                      {uni.tuition_usd_per_year ? (
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <DollarSign size={11} className="text-[#64748B]" />
                          ${uni.tuition_usd_per_year.toLocaleString()}/yr
                        </div>
                      ) : <span />}
                      {uni.min_ielts && (
                        <div className="text-[#64748B]">
                          IELTS: <span className="text-[#1E293B] font-medium">{uni.min_ielts}+</span>
                        </div>
                      )}
                      {uni.min_gpa_percentage && (
                        <div className="text-[#64748B]">
                          GPA: <span className="text-[#1E293B] font-medium">{uni.min_gpa_percentage}%+</span>
                        </div>
                      )}
                      {uni.acceptance_rate_bd && (
                        <div className="text-emerald-600">{uni.acceptance_rate_bd}% BD accept</div>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-[#64748B] text-xs mt-2 italic border-l-2 border-slate-200 pl-2">
                        {item.note}
                      </p>
                    )}
                  </Link>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* ─── Recommended Programs Section ──────────────────────────────── */}
        <div className="mt-10 mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <GraduationCap size={20} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-[#1E293B]">Recommended Programs</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowRecommendModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send size={14} className="mr-1.5" /> Recommend Program
            </Button>
          </div>
          <p className="text-[#64748B] text-sm mb-5">
            {recommendations.length > 0
              ? `${recommendations.length} program${recommendations.length !== 1 ? "s" : ""} recommended`
              : "Recommend specific programs for the student to review and approve"}
          </p>
        </div>

        {/* Recommend Modal */}
        {showRecommendModal && (
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#1E293B] font-semibold">
                {selectedUni ? (
                  <span className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedUni(null); setSelectedProgramId(""); }}
                      className="text-[#64748B] hover:text-[#1E293B]"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    Pick a program at {selectedUni.name}
                  </span>
                ) : (
                  "Search University"
                )}
              </h3>
              <button
                onClick={resetRecommendModal}
                className="text-[#64748B] hover:text-[#1E293B]"
              >
                <X size={16} />
              </button>
            </div>

            {!selectedUni ? (
              <>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <Input
                    placeholder="Search universities..."
                    value={recSearch}
                    onChange={(e) => setRecSearch(e.target.value)}
                    className="pl-8 bg-slate-50 border-slate-200 text-[#1E293B] placeholder:text-[#64748B]"
                    autoFocus
                  />
                </div>
                {recSearch.length >= 2 && recSearchResults.length > 0 && (
                  <div className="space-y-2">
                    {recSearchResults.map((uni) => (
                      <button
                        key={uni.id}
                        onClick={() => setSelectedUni(uni)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <div>
                          <div className="text-[#1E293B] text-sm font-medium">{uni.name}</div>
                          <div className="text-[#64748B] text-xs">
                            {uni.city ? `${uni.city}, ` : ""}{uni.country}
                            {uni.ranking_qs ? ` · QS #${uni.ranking_qs}` : ""}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#64748B]" />
                      </button>
                    ))}
                  </div>
                )}
                {recSearch.length >= 2 && recSearchResults.length === 0 && (
                  <p className="text-[#64748B] text-sm text-center py-4">No universities found</p>
                )}
              </>
            ) : (
              <>
                {activePrograms.length === 0 ? (
                  <p className="text-[#64748B] text-sm text-center py-6">No active programs found at this university</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {activePrograms.map((prog) => (
                      <button
                        key={prog.id}
                        onClick={() => setSelectedProgramId(prog.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                          selectedProgramId === prog.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                      >
                        <div>
                          <div className="text-[#1E293B] text-sm font-medium">{prog.name}</div>
                          <div className="text-[#64748B] text-xs flex items-center gap-2">
                            <span className="capitalize">{prog.degree_level}</span>
                            <span>·</span>
                            <span className="capitalize">{prog.field}</span>
                            {prog.tuition_usd_per_year && (
                              <>
                                <span>·</span>
                                <span>${prog.tuition_usd_per_year.toLocaleString()}/yr</span>
                              </>
                            )}
                          </div>
                        </div>
                        {selectedProgramId === prog.id && (
                          <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedProgramId && (
                  <div className="border-t border-slate-200 pt-4">
                    <textarea
                      value={recNotes}
                      onChange={(e) => setRecNotes(e.target.value)}
                      placeholder="Add a note for the student (optional) — e.g., why this program is a good fit..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 text-[#1E293B] placeholder:text-[#64748B] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none mb-3 transition-colors"
                    />
                    <Button
                      onClick={handleSubmitRecommendation}
                      disabled={recommendMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 w-full"
                    >
                      <Send size={14} className="mr-1.5" />
                      {recommendMutation.isPending ? "Sending..." : "Send Recommendation"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        )}

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const prog = rec.programs;
              const uni = prog?.universities;
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4"
                >
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap size={16} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[#1E293B] text-sm font-semibold truncate">
                          {prog?.name ?? "Program"}
                        </div>
                        <div className="text-[#64748B] text-xs mt-0.5">
                          {uni?.name ?? "University"}
                          {uni?.country ? ` · ${uni.country}` : ""}
                          {prog?.degree_level ? ` · ${prog.degree_level}` : ""}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] font-bold uppercase ${REC_STATUS_STYLES[rec.status] ?? ""}`}
                      >
                        {rec.status === "pending" && <Clock size={9} className="mr-1" />}
                        {rec.status === "approved" && <CheckCircle2 size={9} className="mr-1" />}
                        {rec.status === "rejected" && <XCircle size={9} className="mr-1" />}
                        {rec.status}
                      </Badge>
                    </div>
                    {rec.notes && (
                      <p className="text-[#64748B] text-xs mt-2 italic border-l-2 border-slate-200 pl-2 line-clamp-2">
                        {rec.notes}
                      </p>
                    )}
                    <div className="text-[#94A3B8] text-[10px] mt-2">
                      Recommended {new Date(rec.created_at).toLocaleDateString()}
                      {rec.reviewed_at && ` · Reviewed ${new Date(rec.reviewed_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recommendations.length === 0 && !showRecommendModal && (
          <GlassCard className="text-center py-12">
            <GraduationCap size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-[#64748B] text-sm mb-3">No programs recommended yet</p>
            <Button
              size="sm"
              onClick={() => setShowRecommendModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send size={14} className="mr-1.5" /> Recommend First Program
            </Button>
          </GlassCard>
        )}
      </main>
    </div>
  );
}

export default function ConsultantStudentShortlistPage() {
  return (
    <Providers>
      <ConsultantStudentShortlistContent />
    </Providers>
  );
}
