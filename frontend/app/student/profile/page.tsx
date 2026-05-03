"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User, GraduationCap, Languages, Target, Briefcase,
  CheckCircle2, Loader2, Save, Plus, Trash2, ChevronDown,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Student } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);
const optStr = z.string().nullable().optional();

const schema = z.object({
  // Personal
  full_name: z.string().min(2),
  phone: optStr,
  nationality: optStr,
  date_of_birth: optStr,
  gender: optStr,
  // Passport
  passport_number: optStr,
  passport_issue_date: optStr,
  passport_expiry_date: optStr,
  passport_issue_country: optStr,
  // Address
  address_city: optStr,
  address_country: optStr,
  address_postal_code: optStr,
  // Emergency
  emergency_name: optStr,
  emergency_phone: optStr,
  emergency_relation: optStr,
  // Academics — SSC
  ssc_gpa: optNum,
  ssc_board: optStr,
  ssc_institution: optStr,
  ssc_year: optNum,
  ssc_grading_system: optStr,
  // HSC
  hsc_gpa: optNum,
  hsc_board: optStr,
  hsc_institution: optStr,
  hsc_year: optNum,
  hsc_grading_system: optStr,
  // Bachelor
  bachelor_gpa: optNum,
  bachelor_institution: optStr,
  bachelor_field: optStr,
  bachelor_year: optNum,
  bachelor_grading_system: optStr,
  // Postgrad
  postgrad_gpa: optNum,
  postgrad_institution: optStr,
  postgrad_field: optStr,
  postgrad_year: optNum,
  postgrad_grading_system: optStr,
  // Test Scores
  ielts_score: optNum,
  ielts_listening: optNum,
  ielts_reading: optNum,
  ielts_writing: optNum,
  ielts_speaking: optNum,
  ielts_date: optStr,
  ielts_trf: optStr,
  toefl_score: optNum,
  toefl_date: optStr,
  pte_score: optNum,
  pte_date: optStr,
  duolingo_score: optNum,
  duolingo_date: optStr,
  gre_score: optNum,
  gre_verbal: optNum,
  gre_quant: optNum,
  gre_awa: optNum,
  gre_date: optStr,
  gmat_score: optNum,
  gmat_date: optStr,
  sat_score: optNum,
  sat_date: optStr,
  // Preferences
  target_degree: z.enum(["bachelor", "master", "phd", "diploma"]).optional(),
  budget_usd: optNum,
  target_countries_str: optStr,
  target_fields_str: optStr,
});

type FormData = z.infer<typeof schema>;

interface WorkEntry {
  organization: string;
  position: string;
  start_date: string;
  end_date: string;
  currently_working: boolean;
}

const COMPLETION_FIELDS: (keyof FormData)[] = [
  "full_name", "phone", "nationality", "date_of_birth", "gender",
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

const GRADING_SYSTEMS = [
  { value: "out_of_5", label: "Out of 5.0" },
  { value: "out_of_4", label: "Out of 4.0" },
  { value: "out_of_10", label: "Out of 10" },
  { value: "percentage", label: "Percentage" },
  { value: "out_of_7", label: "Out of 7" },
];

const tabConfig = [
  { value: "personal", label: "Personal", icon: User },
  { value: "academics", label: "Academics", icon: GraduationCap },
  { value: "scores", label: "Test Scores", icon: Languages },
  { value: "work", label: "Work Experience", icon: Briefcase },
  { value: "preferences", label: "Preferences", icon: Target },
];

function buildPayload(data: FormData, workExperience: WorkEntry[]) {
  const str = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  const num = (v: number | undefined) => (v != null && !isNaN(v) ? v : null);

  return {
    full_name: data.full_name,
    phone: str(data.phone),
    nationality: str(data.nationality),
    date_of_birth: str(data.date_of_birth),
    gender: str(data.gender),
    personal_details: {
      passport_number: str(data.passport_number),
      passport_issue_date: str(data.passport_issue_date),
      passport_expiry_date: str(data.passport_expiry_date),
      passport_issue_country: str(data.passport_issue_country),
      address_city: str(data.address_city),
      address_country: str(data.address_country),
      address_postal_code: str(data.address_postal_code),
      emergency_name: str(data.emergency_name),
      emergency_phone: str(data.emergency_phone),
      emergency_relation: str(data.emergency_relation),
    },
    academic_history: {
      ssc_gpa: num(data.ssc_gpa),
      ssc_board: str(data.ssc_board),
      ssc_institution: str(data.ssc_institution),
      ssc_year: num(data.ssc_year),
      ssc_grading_system: str(data.ssc_grading_system),
      hsc_gpa: num(data.hsc_gpa),
      hsc_board: str(data.hsc_board),
      hsc_institution: str(data.hsc_institution),
      hsc_year: num(data.hsc_year),
      hsc_grading_system: str(data.hsc_grading_system),
      bachelor_cgpa: num(data.bachelor_gpa),
      bachelor_institution: str(data.bachelor_institution),
      bachelor_subject: str(data.bachelor_field),
      bachelor_year: num(data.bachelor_year),
      bachelor_grading_system: str(data.bachelor_grading_system),
      postgrad_gpa: num(data.postgrad_gpa),
      postgrad_institution: str(data.postgrad_institution),
      postgrad_field: str(data.postgrad_field),
      postgrad_year: num(data.postgrad_year),
      postgrad_grading_system: str(data.postgrad_grading_system),
    },
    test_scores: {
      ielts: num(data.ielts_score),
      ielts_listening: num(data.ielts_listening),
      ielts_reading: num(data.ielts_reading),
      ielts_writing: num(data.ielts_writing),
      ielts_speaking: num(data.ielts_speaking),
      ielts_date: str(data.ielts_date),
      ielts_trf: str(data.ielts_trf),
      toefl: num(data.toefl_score),
      toefl_date: str(data.toefl_date),
      pte: num(data.pte_score),
      pte_date: str(data.pte_date),
      duolingo: num(data.duolingo_score),
      duolingo_date: str(data.duolingo_date),
      gre: num(data.gre_score),
      gre_verbal: num(data.gre_verbal),
      gre_quant: num(data.gre_quant),
      gre_awa: num(data.gre_awa),
      gre_date: str(data.gre_date),
      gmat: num(data.gmat_score),
      gmat_date: str(data.gmat_date),
      sat: num(data.sat_score),
      sat_date: str(data.sat_date),
    },
    work_experience: workExperience.filter(w => w.organization || w.position),
    preferred_degree: data.target_degree || null,
    budget_usd_per_year: num(data.budget_usd),
    preferred_countries: data.target_countries_str?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) ?? [],
    preferred_fields: data.target_fields_str?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
  };
}

function SectionHeader({ title, icon: Icon }: { title: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
      {Icon && <Icon size={16} className="text-emerald-600" />}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedRef = useRef<string>("");
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const workRef = useRef<string>("[]");

  const { data: student } = useQuery<Student>({
    queryKey: ["student-me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data?.profile ?? res.data;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, reset, watch, setValue: setFormValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  const watchedValues = watch();
  const completion = computeCompletion(watchedValues);

  useEffect(() => {
    if (student) {
      const ah = student.academic_history as Record<string, unknown> | undefined;
      const ts = student.test_scores as Record<string, unknown> | undefined;
      const pd = student.personal_details as Record<string, unknown> | undefined;
      const initial: FormData = {
        full_name: student.full_name ?? "",
        phone: student.phone ?? "",
        nationality: student.nationality ?? "",
        date_of_birth: student.date_of_birth ?? "",
        gender: student.gender ?? "",
        // Passport
        passport_number: (pd?.passport_number as string) ?? "",
        passport_issue_date: (pd?.passport_issue_date as string) ?? "",
        passport_expiry_date: (pd?.passport_expiry_date as string) ?? "",
        passport_issue_country: (pd?.passport_issue_country as string) ?? "",
        // Address
        address_city: (pd?.address_city as string) ?? "",
        address_country: (pd?.address_country as string) ?? "",
        address_postal_code: (pd?.address_postal_code as string) ?? "",
        // Emergency
        emergency_name: (pd?.emergency_name as string) ?? "",
        emergency_phone: (pd?.emergency_phone as string) ?? "",
        emergency_relation: (pd?.emergency_relation as string) ?? "",
        // SSC
        ssc_gpa: (ah?.ssc_gpa as number) ?? undefined,
        ssc_board: (ah?.ssc_board as string) ?? "",
        ssc_institution: (ah?.ssc_institution as string) ?? "",
        ssc_year: (ah?.ssc_year as number) ?? undefined,
        ssc_grading_system: (ah?.ssc_grading_system as string) ?? "",
        // HSC
        hsc_gpa: (ah?.hsc_gpa as number) ?? undefined,
        hsc_board: (ah?.hsc_board as string) ?? "",
        hsc_institution: (ah?.hsc_institution as string) ?? "",
        hsc_year: (ah?.hsc_year as number) ?? undefined,
        hsc_grading_system: (ah?.hsc_grading_system as string) ?? "",
        // Bachelor
        bachelor_gpa: (ah?.bachelor_cgpa as number) ?? undefined,
        bachelor_institution: (ah?.bachelor_institution as string) ?? "",
        bachelor_field: (ah?.bachelor_subject as string) ?? "",
        bachelor_year: (ah?.bachelor_year as number) ?? undefined,
        bachelor_grading_system: (ah?.bachelor_grading_system as string) ?? "",
        // Postgrad
        postgrad_gpa: (ah?.postgrad_gpa as number) ?? undefined,
        postgrad_institution: (ah?.postgrad_institution as string) ?? "",
        postgrad_field: (ah?.postgrad_field as string) ?? "",
        postgrad_year: (ah?.postgrad_year as number) ?? undefined,
        postgrad_grading_system: (ah?.postgrad_grading_system as string) ?? "",
        // Test Scores
        ielts_score: (ts?.ielts as number) ?? undefined,
        ielts_listening: (ts?.ielts_listening as number) ?? undefined,
        ielts_reading: (ts?.ielts_reading as number) ?? undefined,
        ielts_writing: (ts?.ielts_writing as number) ?? undefined,
        ielts_speaking: (ts?.ielts_speaking as number) ?? undefined,
        ielts_date: (ts?.ielts_date as string) ?? "",
        ielts_trf: (ts?.ielts_trf as string) ?? "",
        toefl_score: (ts?.toefl as number) ?? undefined,
        toefl_date: (ts?.toefl_date as string) ?? "",
        pte_score: (ts?.pte as number) ?? undefined,
        pte_date: (ts?.pte_date as string) ?? "",
        duolingo_score: (ts?.duolingo as number) ?? undefined,
        duolingo_date: (ts?.duolingo_date as string) ?? "",
        gre_score: (ts?.gre as number) ?? undefined,
        gre_verbal: (ts?.gre_verbal as number) ?? undefined,
        gre_quant: (ts?.gre_quant as number) ?? undefined,
        gre_awa: (ts?.gre_awa as number) ?? undefined,
        gre_date: (ts?.gre_date as string) ?? "",
        gmat_score: (ts?.gmat as number) ?? undefined,
        gmat_date: (ts?.gmat_date as string) ?? "",
        sat_score: (ts?.sat as number) ?? undefined,
        sat_date: (ts?.sat_date as string) ?? "",
        // Preferences
        target_degree: (student.preferred_degree as FormData["target_degree"]) ?? undefined,
        budget_usd: student.budget_usd_per_year ?? undefined,
        target_countries_str: student.preferred_countries?.join(", ") ?? "",
        target_fields_str: student.preferred_fields?.join(", ") ?? "",
      };
      reset(initial);
      lastSavedRef.current = JSON.stringify(initial);
      setIsDirty(false);

      const we = (student.work_experience ?? []) as WorkEntry[];
      setWorkEntries(we);
      workRef.current = JSON.stringify(we);
    }
  }, [student, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.patch("/auth/student/profile", buildPayload(data, workEntries));
    },
    onMutate: () => setSaveStatus("saving"),
    onSuccess: (_data, variables) => {
      lastSavedRef.current = JSON.stringify(variables);
      workRef.current = JSON.stringify(workEntries);
      setIsDirty(false);
      setSaveStatus("saved");
      qc.invalidateQueries({ queryKey: ["student-me"] });
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
      savedFadeRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
      try {
        const lastSaved = JSON.parse(lastSavedRef.current) as FormData;
        reset(lastSaved);
        setWorkEntries(JSON.parse(workRef.current));
        setIsDirty(false);
      } catch { /* noop */ }
      toast.error("Failed to save profile. Your changes have been reverted.");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  const doSave = useCallback(() => {
    handleSubmit((data) => saveMutation.mutate(data as FormData))();
  }, [handleSubmit, saveMutation]);

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!student) return;
    if (!isInitialized.current) { isInitialized.current = true; return; }
    const formDirty = JSON.stringify(watchedValues) !== lastSavedRef.current;
    const workDirty = JSON.stringify(workEntries) !== workRef.current;
    setIsDirty(formDirty || workDirty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues), JSON.stringify(workEntries)]);

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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const addWorkEntry = () => {
    setWorkEntries([...workEntries, { organization: "", position: "", start_date: "", end_date: "", currently_working: false }]);
  };

  const removeWorkEntry = (index: number) => {
    setWorkEntries(workEntries.filter((_, i) => i !== index));
  };

  const updateWorkEntry = (index: number, field: keyof WorkEntry, value: string | boolean) => {
    const updated = [...workEntries];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setWorkEntries(updated);
  };

  const inputClass = "bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/20 rounded-xl h-11";
  const selectClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all";

  const renderField = (label: string, name: keyof FormData, type = "text", placeholder?: string) => (
    <div key={name}>
      <Label className="text-slate-600 mb-1.5 block text-sm font-medium">{label}</Label>
      <Input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className={inputClass}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{String(errors[name]?.message)}</p>}
    </div>
  );

  const renderSelect = (label: string, name: keyof FormData, options: { value: string; label: string }[]) => (
    <div key={name}>
      <Label className="text-slate-600 mb-1.5 block text-sm font-medium">{label}</Label>
      <select {...register(name)} className={selectClass}>
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <PageWrapper title="My Profile" subtitle="Update your info so we can find better matches.">
      {/* Profile Completion Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Profile Completion</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {completion}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-slate-400 animate-in fade-in duration-200">
                <Loader2 size={12} className="animate-spin" /> Saving changes...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-600 animate-in fade-in duration-200">
                <CheckCircle2 size={12} /> All changes saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-red-500 animate-in fade-in duration-200">Save failed</span>
            )}
            {saveStatus === "idle" && isDirty && (
              <span className="flex items-center gap-1.5 text-amber-500 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsaved changes
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

        {/* ── Personal ────────────────────────────────────── */}
        <TabsContent value="personal">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader title="Basic Information" icon={User} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("Full Name", "full_name", "text", "Your full name")}
                {renderField("Phone", "phone", "tel", "+880 17...")}
                {renderField("Nationality", "nationality", "text", "e.g. Bangladeshi")}
                {renderField("Date of Birth", "date_of_birth", "date")}
                {renderSelect("Gender", "gender", [
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ])}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader title="Passport Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderField("Passport Number", "passport_number", "text", "Enter number")}
                {renderField("Issue Date", "passport_issue_date", "date")}
                {renderField("Expiry Date", "passport_expiry_date", "date")}
                {renderField("Issue Country", "passport_issue_country", "text", "e.g. Bangladesh")}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader title="Address" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("City", "address_city", "text", "Enter city")}
                {renderField("Country", "address_country", "text", "e.g. Bangladesh")}
                {renderField("Postal Code", "address_postal_code", "text", "Enter postal code")}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader title="Emergency Contact" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("Contact Name", "emergency_name", "text", "Enter name")}
                {renderField("Contact Phone", "emergency_phone", "tel", "Phone number")}
                {renderField("Relation", "emergency_relation", "text", "e.g. Parent, Sibling")}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Academics ───────────────────────────────────── */}
        <TabsContent value="academics">
          <div className="space-y-4">
            <CollapsibleSection title="SSC / O-Level" defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("GPA / Score", "ssc_gpa", "number", "e.g. 5.00")}
                {renderSelect("Grading System", "ssc_grading_system", GRADING_SYSTEMS)}
                {renderField("Board", "ssc_board", "text", "e.g. Dhaka Board")}
                {renderField("Institution", "ssc_institution", "text", "School name")}
                {renderField("Year", "ssc_year", "number", "e.g. 2018")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="HSC / A-Level" defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("GPA / Score", "hsc_gpa", "number", "e.g. 5.00")}
                {renderSelect("Grading System", "hsc_grading_system", GRADING_SYSTEMS)}
                {renderField("Board", "hsc_board", "text", "e.g. Dhaka Board")}
                {renderField("Institution", "hsc_institution", "text", "College name")}
                {renderField("Year", "hsc_year", "number", "e.g. 2020")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Bachelor's / Undergraduate" defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("GPA / CGPA", "bachelor_gpa", "number", "e.g. 3.75")}
                {renderSelect("Grading System", "bachelor_grading_system", GRADING_SYSTEMS)}
                {renderField("Institution", "bachelor_institution", "text", "e.g. BUET")}
                {renderField("Field of Study", "bachelor_field", "text", "e.g. Computer Science")}
                {renderField("Year of Completion", "bachelor_year", "number", "e.g. 2024")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Postgraduate (if applicable)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField("GPA / CGPA", "postgrad_gpa", "number", "e.g. 3.80")}
                {renderSelect("Grading System", "postgrad_grading_system", GRADING_SYSTEMS)}
                {renderField("Institution", "postgrad_institution", "text", "University name")}
                {renderField("Field of Study", "postgrad_field", "text", "e.g. Data Science")}
                {renderField("Year of Completion", "postgrad_year", "number", "e.g. 2026")}
              </div>
            </CollapsibleSection>
          </div>
        </TabsContent>

        {/* ── Test Scores ─────────────────────────────────── */}
        <TabsContent value="scores">
          <div className="space-y-4">
            <CollapsibleSection title="IELTS" defaultOpen>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderField("Overall Score (0–9)", "ielts_score", "number", "7.0")}
                {renderField("Listening", "ielts_listening", "number", "7.5")}
                {renderField("Reading", "ielts_reading", "number", "7.0")}
                {renderField("Writing", "ielts_writing", "number", "6.5")}
                {renderField("Speaking", "ielts_speaking", "number", "7.0")}
                {renderField("TRF Number", "ielts_trf", "text", "TRF No.")}
                {renderField("Date of Exam", "ielts_date", "date")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="TOEFL">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField("Score (0–120)", "toefl_score", "number", "95")}
                {renderField("Date of Exam", "toefl_date", "date")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="PTE">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField("Score (10–90)", "pte_score", "number", "65")}
                {renderField("Date of Exam", "pte_date", "date")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Duolingo English Test">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField("Score (10–160)", "duolingo_score", "number", "120")}
                {renderField("Date of Exam", "duolingo_date", "date")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="GRE">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderField("Total (260–340)", "gre_score", "number", "320")}
                {renderField("Verbal (130–170)", "gre_verbal", "number", "160")}
                {renderField("Quant (130–170)", "gre_quant", "number", "160")}
                {renderField("AWA (0–6)", "gre_awa", "number", "4.5")}
                {renderField("Date of Exam", "gre_date", "date")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="GMAT">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField("Score (200–800)", "gmat_score", "number", "680")}
                {renderField("Date of Exam", "gmat_date", "date")}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="SAT">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField("Score (400–1600)", "sat_score", "number", "1400")}
                {renderField("Date of Exam", "sat_date", "date")}
              </div>
            </CollapsibleSection>

            <p className="text-slate-400 text-xs">Leave sections blank if not applicable.</p>
          </div>
        </TabsContent>

        {/* ── Work Experience ─────────────────────────────── */}
        <TabsContent value="work">
          <div className="space-y-4">
            {workEntries.map((entry, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Experience {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkEntry(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} className="mr-1" /> Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-600 mb-1.5 block text-sm font-medium">Organization</Label>
                    <Input
                      value={entry.organization}
                      onChange={(e) => updateWorkEntry(index, "organization", e.target.value)}
                      placeholder="Company name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1.5 block text-sm font-medium">Position</Label>
                    <Input
                      value={entry.position}
                      onChange={(e) => updateWorkEntry(index, "position", e.target.value)}
                      placeholder="Job title"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1.5 block text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      value={entry.start_date}
                      onChange={(e) => updateWorkEntry(index, "start_date", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1.5 block text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      value={entry.end_date}
                      onChange={(e) => updateWorkEntry(index, "end_date", e.target.value)}
                      disabled={entry.currently_working}
                      className={inputClass}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.currently_working}
                    onChange={(e) => {
                      updateWorkEntry(index, "currently_working", e.target.checked);
                      if (e.target.checked) updateWorkEntry(index, "end_date", "");
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-600">I am currently working here</span>
                </label>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addWorkEntry}
              className="w-full border-dashed"
            >
              <Plus size={16} className="mr-2" /> Add Work Experience
            </Button>

            {workEntries.length === 0 && (
              <p className="text-slate-400 text-xs text-center mt-2">
                No work experience added yet. Click above to add one.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Preferences ─────────────────────────────────── */}
        <TabsContent value="preferences">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-5">
              <div>
                <Label className="text-slate-600 mb-1.5 block text-sm font-medium">Target Degree</Label>
                <select
                  {...register("target_degree")}
                  className={selectClass}
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

      {/* Sticky save bar */}
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
