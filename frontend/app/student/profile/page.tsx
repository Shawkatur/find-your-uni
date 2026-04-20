"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, GraduationCap, Languages, Target, CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { Student } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  ssc_gpa: z.coerce.number().optional(),
  hsc_gpa: z.coerce.number().optional(),
  bachelor_gpa: z.coerce.number().optional(),
  bachelor_institution: z.string().nullable().optional(),
  bachelor_field: z.string().nullable().optional(),
  ielts_score: z.coerce.number().optional(),
  toefl_score: z.coerce.number().optional(),
  gre_score: z.coerce.number().optional(),
  gmat_score: z.coerce.number().optional(),
  target_degree: z.enum(["bachelor", "master", "phd", "diploma"]).optional(),
  budget_usd: z.coerce.number().optional(),
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

export default function StudentProfilePage() {
  const qc = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      reset({
        full_name: student.full_name,
        phone: student.phone,
        nationality: student.nationality,
        ssc_gpa: student.ssc_gpa,
        hsc_gpa: student.hsc_gpa,
        bachelor_gpa: student.bachelor_gpa,
        bachelor_institution: student.bachelor_institution,
        bachelor_field: student.bachelor_field,
        ielts_score: student.ielts_score,
        toefl_score: student.toefl_score,
        gre_score: student.gre_score,
        gmat_score: student.gmat_score,
        target_degree: student.target_degree,
        budget_usd: student.budget_usd,
        target_countries_str: student.target_countries?.join(", "),
        target_fields_str: student.target_fields?.join(", "),
      });
    }
  }, [student, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.patch("/auth/student/profile", {
        full_name: data.full_name,
        phone: data.phone || undefined,
        academic_history: {
          ssc_gpa:          data.ssc_gpa || undefined,
          hsc_gpa:          data.hsc_gpa || undefined,
          bachelor_cgpa:    data.bachelor_gpa || undefined,
          bachelor_institution: data.bachelor_institution || undefined,
          bachelor_subject: data.bachelor_field || undefined,
        },
        test_scores: {
          ielts: data.ielts_score || undefined,
          toefl: data.toefl_score || undefined,
          gre:   data.gre_score   || undefined,
          gmat:  data.gmat_score  || undefined,
        },
        preferred_degree:    data.target_degree,
        budget_usd_per_year: data.budget_usd,
        preferred_countries: data.target_countries_str?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
        preferred_fields:    data.target_fields_str?.split(",").map((s) => s.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      setSaveStatus("saved");
      qc.invalidateQueries({ queryKey: ["student-me"] });
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      setSaveStatus("idle");
      toast.error("Failed to save profile.");
    },
  });

  const debouncedSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSaveStatus("saving");
      handleSubmit((data) => saveMutation.mutate(data as FormData))();
    }, 1500);
  }, [handleSubmit, saveMutation]);

  // Auto-save on field changes (skip initial load)
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!student) return;
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    debouncedSave();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

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
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={12} className="animate-spin text-slate-400" />
                <span className="text-slate-400">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-emerald-600">Saved</span>
              </>
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
    </PageWrapper>
  );
}
