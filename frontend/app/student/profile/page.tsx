"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, GraduationCap, Languages, Target, CheckCircle2, Loader2, Save } from "lucide-react";
import api from "@/lib/api";
import type { Student } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Coerce empty strings to undefined so blank number inputs don't produce NaN
const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  ssc_gpa: optNum,
  hsc_gpa: optNum,
  bachelor_gpa: optNum,
  bachelor_institution: z.string().nullable().optional(),
  bachelor_field: z.string().nullable().optional(),
  ielts_score: optNum,
  toefl_score: optNum,
  gre_score: optNum,
  gmat_score: optNum,
  target_degree: z.enum(["bachelor", "master", "phd", "diploma"]).optional(),
  budget_usd: optNum,
  target_countries_str: z.string().nullable().optional(),
  target_fields_str: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

// Fields that count toward profile completion
const COMPLETION_FIELDS: (keyof FormData)[] = [
  "full_name", "phone", "nationality",
  "ssc_gpa", "hsc_gpa", "bachelor_gpa", "bachelor_institution", "bachelor_field",
  "ielts_score",
  "target_degree", "budget_usd", "target_countries_str", "target_fields_str",
];

function computeCompletion(data: FormData): number {
  let filled = 0;
  for (const key of COMPLETION_FIELDS) {
    const v = data[key];
    if (v !== undefined && v !== null && v !== "" && v !== 0) filled++;
  }
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

function getCompletionMessage(pct: number): string {
  if (pct >= 100) return "Your profile is complete! You're ready for the best matches.";
  if (pct >= 75) return "Almost there! Fill in a few more details to unlock better matches.";
  if (pct >= 50) return "Good progress! Add your test scores and preferences for more accurate results.";
  return "Complete your profile to unlock personalized university matches!";
}

const tabConfig = [
  { value: "personal", label: "Personal", icon: User },
  { value: "academics", label: "Academics", icon: GraduationCap },
  { value: "scores", label: "Test Scores", icon: Languages },
  { value: "preferences", label: "Preferences", icon: Target },
];

function buildPayload(data: FormData) {
  const str = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  const num = (v: number | undefined) => (v != null && !isNaN(v) ? v : null);

  return {
    full_name: data.full_name,
    phone: str(data.phone),
    nationality: str(data.nationality),
    academic_history: {
      ssc_gpa:             num(data.ssc_gpa),
      hsc_gpa:             num(data.hsc_gpa),
      bachelor_cgpa:       num(data.bachelor_gpa),
      bachelor_institution: str(data.bachelor_institution),
      bachelor_subject:    str(data.bachelor_field),
    },
    test_scores: {
      ielts: num(data.ielts_score),
      toefl: num(data.toefl_score),
      gre:   num(data.gre_score),
      gmat:  num(data.gmat_score),
    },
    preferred_degree:    data.target_degree || null,
    budget_usd_per_year: num(data.budget_usd),
    preferred_countries: data.target_countries_str?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) ?? [],
    preferred_fields:    data.target_fields_str?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
  };
}

export default function StudentProfilePage() {
  const qc = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedRef = useRef<string>("");
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: student } = useQuery<Student>({
    queryKey: ["student-me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      const profile = res.data?.profile ?? res.data;
      return {
        ...profile,
        ssc_gpa:              profile?.academic_history?.ssc_gpa,
        hsc_gpa:              profile?.academic_history?.hsc_gpa,
        bachelor_gpa:         profile?.academic_history?.bachelor_cgpa,
        bachelor_institution: profile?.academic_history?.bachelor_institution,
        bachelor_field:       profile?.academic_history?.bachelor_subject,
        ielts_score:          profile?.test_scores?.ielts,
        toefl_score:          profile?.test_scores?.toefl,
        gre_score:            profile?.test_scores?.gre,
        gmat_score:           profile?.test_scores?.gmat,
        target_degree:        profile?.preferred_degree,
        budget_usd:           profile?.budget_usd_per_year,
        target_countries:     profile?.preferred_countries,
        target_fields:        profile?.preferred_fields,
      };
    },
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  const watchedValues = watch();
  const completion = computeCompletion(watchedValues);

  useEffect(() => {
    if (student) {
      const initial: FormData = {
        full_name: student.full_name ?? "",
        phone: student.phone ?? "",
        nationality: student.nationality ?? "",
        ssc_gpa: student.ssc_gpa ?? undefined,
        hsc_gpa: student.hsc_gpa ?? undefined,
        bachelor_gpa: student.bachelor_gpa ?? undefined,
        bachelor_institution: student.bachelor_institution ?? "",
        bachelor_field: student.bachelor_field ?? "",
        ielts_score: student.ielts_score ?? undefined,
        toefl_score: student.toefl_score ?? undefined,
        gre_score: student.gre_score ?? undefined,
        gmat_score: student.gmat_score ?? undefined,
        target_degree: student.target_degree ?? undefined,
        budget_usd: student.budget_usd ?? undefined,
        target_countries_str: student.target_countries?.join(", ") ?? "",
        target_fields_str: student.target_fields?.join(", ") ?? "",
      };
      reset(initial);
      lastSavedRef.current = JSON.stringify(initial);
      setIsDirty(false);
    }
  }, [student, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.patch("/auth/student/profile", buildPayload(data));
    },
    onMutate: () => {
      setSaveStatus("saving");
    },
    onSuccess: (_data, variables) => {
      lastSavedRef.current = JSON.stringify(variables);
      setIsDirty(false);
      setSaveStatus("saved");
      qc.invalidateQueries({ queryKey: ["student-me"] });
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
      savedFadeRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: (_err, variables) => {
      setSaveStatus("error");
      // Roll back to last saved state on failure
      try {
        const lastSaved = JSON.parse(lastSavedRef.current) as FormData;
        reset(lastSaved);
        setIsDirty(false);
      } catch {
        // If parse fails, leave form as-is
      }
      toast.error("Failed to save profile. Your changes have been reverted.");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  const doSave = useCallback(() => {
    handleSubmit((data) => saveMutation.mutate(data as FormData))();
  }, [handleSubmit, saveMutation]);

  // Track dirty state on field changes (skip initial load)
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!student) return;
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const currentJson = JSON.stringify(watchedValues);
    setIsDirty(currentJson !== lastSavedRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !saveMutation.isPending) doSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, saveMutation.isPending, doSave]);

  // Save on page leave if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const renderField = (label: string, name: keyof FormData, type = "text", placeholder?: string) => (
    <div key={name}>
      <Label className="text-slate-600 mb-1.5 block text-sm font-medium">{label}</Label>
      <Input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/20 rounded-xl h-11"
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <PageWrapper
      title="My Profile"
      subtitle="Update your info so we can find better matches."
    >
      {/* Profile Completion Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Profile Completion</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {completion}%
            </span>
          </div>
          {/* Save status indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-slate-400 animate-in fade-in duration-200">
                <Loader2 size={12} className="animate-spin" />
                Saving changes...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-600 animate-in fade-in duration-200">
                <CheckCircle2 size={12} />
                All changes saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-red-500 animate-in fade-in duration-200">
                Save failed
              </span>
            )}
            {saveStatus === "idle" && isDirty && (
              <span className="flex items-center gap-1.5 text-amber-500 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{getCompletionMessage(completion)}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="bg-slate-100 border border-slate-200 mb-6 flex-wrap rounded-xl p-1 gap-1">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 rounded-lg gap-1.5 px-3"
              >
                <Icon size={14} />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="personal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderField("Full Name", "full_name", "text", "Your full name")}
              {renderField("Phone", "phone", "tel", "+880 17...")}
              {renderField("Nationality", "nationality", "text", "e.g. Bangladeshi")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academics">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderField("SSC GPA (out of 5.0)", "ssc_gpa", "number", "4.50")}
              {renderField("HSC GPA (out of 5.0)", "hsc_gpa", "number", "5.00")}
              {renderField("Bachelor GPA (out of 4.0)", "bachelor_gpa", "number", "3.75")}
              {renderField("Bachelor Institution", "bachelor_institution", "text", "e.g. BUET")}
              {renderField("Field of Study", "bachelor_field", "text", "e.g. Computer Science")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scores">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderField("IELTS Score (0–9)", "ielts_score", "number", "7.0")}
              {renderField("TOEFL Score (0–120)", "toefl_score", "number", "95")}
              {renderField("GRE Score (260–340)", "gre_score", "number", "320")}
              {renderField("GMAT Score (200–800)", "gmat_score", "number", "680")}
            </div>
            <p className="text-slate-400 text-xs mt-4">Leave blank if not applicable.</p>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-5">
              <div>
                <Label className="text-slate-600 mb-1.5 block text-sm font-medium">Target Degree</Label>
                <select
                  {...register("target_degree")}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="bachelor">Bachelor&apos;s</option>
                  <option value="master">Master&apos;s</option>
                  <option value="phd">PhD</option>
                  <option value="diploma">Diploma</option>
                </select>
              </div>
              {renderField("Annual Budget (USD)", "budget_usd", "number", "25000")}
              {renderField("Target Countries (comma-separated)", "target_countries_str", "text", "USA, UK, Canada")}
              {renderField("Fields of Interest (comma-separated)", "target_fields_str", "text", "Computer Science, Data Science")}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar — appears when form is dirty */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                You have unsaved changes
              </div>
              <Button
                size="sm"
                onClick={doSave}
                disabled={saveMutation.isPending}
                className="px-5"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={14} className="mr-1.5" />
                )}
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
