"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FieldDef {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

const stepTitles = ["Account", "About You", "Academics", "Test Scores", "Preferences"];

type FormValues = Record<string, string>;

const COUNTRY_ISO: Record<string, string> = {
  "usa": "US", "united states": "US", "america": "US", "us": "US",
  "uk": "GB", "united kingdom": "GB", "england": "GB", "britain": "GB", "gb": "GB",
  "canada": "CA", "ca": "CA",
  "germany": "DE", "de": "DE",
  "australia": "AU", "au": "AU",
  "singapore": "SG", "sg": "SG",
  "netherlands": "NL", "nl": "NL", "holland": "NL",
  "sweden": "SE", "se": "SE",
  "new zealand": "NZ", "nz": "NZ",
  "japan": "JP", "jp": "JP",
  "france": "FR", "fr": "FR",
  "italy": "IT", "it": "IT",
  "ireland": "IE", "ie": "IE",
  "malaysia": "MY", "my": "MY",
  "south korea": "KR", "korea": "KR", "kr": "KR",
};

function toISO(name: string): string {
  return COUNTRY_ISO[name.trim().toLowerCase()] ?? name.trim().toUpperCase().slice(0, 2);
}

function validateStep(step: number, values: FormValues): Record<string, string> {
  const errs: Record<string, string> = {};
  if (step === 0) {
    if (!values.email?.includes("@")) errs.email = "Valid email required";
    if ((values.password?.length ?? 0) < 8) errs.password = "At least 8 characters";
    if (values.password !== values.confirmPassword) errs.confirmPassword = "Passwords don't match";
  }
  if (step === 1) {
    if ((values.full_name?.length ?? 0) < 2) errs.full_name = "Name required";
  }
  return errs;
}

const stepFields: FieldDef[][] = [
  [
    { name: "email", label: "Email", type: "email", placeholder: "you@example.com", required: true },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters", required: true },
    { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat password", required: true },
  ],
  [
    { name: "full_name", label: "Full Name", placeholder: "e.g. Rahim Chowdhury", required: true },
    { name: "phone", label: "Phone (optional)", type: "tel", placeholder: "+880 17..." },
    { name: "nationality", label: "Nationality", placeholder: "e.g. Bangladeshi" },
    { name: "date_of_birth", label: "Date of Birth", type: "date" },
    { name: "gender", label: "Gender" },
  ],
  [
    { name: "ssc_gpa", label: "SSC GPA (5.0)", type: "number", placeholder: "4.50" },
    { name: "hsc_gpa", label: "HSC GPA (5.0)", type: "number", placeholder: "5.00" },
    { name: "bachelor_gpa", label: "Bachelor GPA (4.0)", type: "number", placeholder: "3.75" },
    { name: "bachelor_institution", label: "Institution", placeholder: "e.g. BUET" },
    { name: "bachelor_field", label: "Field of Study", placeholder: "e.g. Computer Science" },
  ],
  [
    { name: "ielts_score", label: "IELTS Score (0–9)", type: "number", placeholder: "7.0" },
    { name: "toefl_score", label: "TOEFL Score (0–120)", type: "number", placeholder: "95" },
    { name: "gre_score", label: "GRE Score (260–340)", type: "number", placeholder: "320" },
    { name: "gmat_score", label: "GMAT Score (200–800)", type: "number", placeholder: "680" },
  ],
];

const REF_STORAGE_KEY = "findyouruni_ref_code";

function usePersistedRef(): string | undefined {
  const searchParams = useSearchParams();
  const paramRef = searchParams.get("ref") ?? undefined;

  // If a ref is in the URL, persist it to sessionStorage
  if (paramRef && typeof window !== "undefined") {
    sessionStorage.setItem(REF_STORAGE_KEY, paramRef);
  }

  // Return URL param first, then fall back to stored value
  if (paramRef) return paramRef;
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(REF_STORAGE_KEY) ?? undefined;
  }
  return undefined;
}

function StudentRegisterForm() {
  const router = useRouter();
  const refCode = usePersistedRef();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>({ target_degree: "master" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleNext = async () => {
    const errs = validateStep(step, values);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    if (step < 4) { setStep(step + 1); return; }
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.full_name, role: "student" } },
      });
      if (authErr && !authErr.message.includes("already") && !authErr.message.includes("rate")) {
        throw authErr;
      }

      if (!authData?.session) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (signInErr || !signInData.session) {
          if (authErr?.message.includes("already")) {
            toast.error("An account with this email already exists. Please sign in instead.");
            return;
          }
          toast.success("Account created! Check your email to confirm, then sign in.");
          router.push("/auth/login");
          return;
        }
      }

      await api.post("/auth/student/register", {
        full_name: values.full_name,
        phone: values.phone || undefined,
        nationality: values.nationality || undefined,
        date_of_birth: values.date_of_birth || undefined,
        gender: values.gender || undefined,
        academic_history: {
          ssc_gpa:          values.ssc_gpa          ? parseFloat(values.ssc_gpa)          : undefined,
          hsc_gpa:          values.hsc_gpa          ? parseFloat(values.hsc_gpa)          : undefined,
          bachelor_cgpa:    values.bachelor_gpa     ? parseFloat(values.bachelor_gpa)     : undefined,
          bachelor_subject: values.bachelor_field   || undefined,
        },
        test_scores: {
          ielts: values.ielts_score ? parseFloat(values.ielts_score) : undefined,
          toefl: values.toefl_score ? parseInt(values.toefl_score)   : undefined,
          gre:   values.gre_score   ? parseInt(values.gre_score)     : undefined,
          gmat:  values.gmat_score  ? parseInt(values.gmat_score)    : undefined,
        },
        budget_usd_per_year: values.budget_usd ? parseInt(values.budget_usd) : 20000,
        preferred_degree:    values.target_degree ?? "master",
        preferred_countries: values.target_countries?.split(",").map((s) => toISO(s)).filter(Boolean) ?? [],
        preferred_fields:    values.target_fields?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
        ref_code:            refCode,
      });

      // Clear persisted referral code after successful registration
      sessionStorage.removeItem(REF_STORAGE_KEY);
      toast.success("You're in! Let's go.");
      router.push("/student/dashboard");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.response?.status === 409) {
        toast.success("Welcome back! Redirecting...");
        router.push("/student/dashboard");
        return;
      }
      const msg = err instanceof Error ? err.message : "Registration failed";
      if (msg.toLowerCase().includes("email signups are disabled") || msg.toLowerCase().includes("signups not allowed")) {
        toast.error("Email sign-up is currently disabled. Please contact support or try again later.");
        return;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center mb-3">
            <GraduationCap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#333]">Create your account</h1>
          <p className="text-[#64748B] text-sm mt-1">Step {step + 1} of 5 — {stepTitles[step]}</p>
        </div>

        <Progress value={progress} className="mb-6 h-1.5 bg-[#E2E8F0]" />

        <div className="flex justify-between mb-8 px-2">
          {stepTitles.map((title, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                i < step ? "bg-[#10B981] text-white" :
                i === step ? "bg-[#10B981] text-white ring-2 ring-[#10B981]/30" :
                "bg-[#E2E8F0] text-[#64748B]"
              )}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:block", i === step ? "text-[#333]" : "text-[#64748B]")}>
                {title}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          <div className="space-y-5">
            {step < 4 && (
              <div className={step === 2 ? "grid grid-cols-2 gap-4" : step === 1 ? "grid grid-cols-2 gap-4" : "space-y-5"}>
                {stepFields[step].map((field) => {
                  const spanFull = (step === 2 && ["bachelor_institution", "bachelor_field"].includes(field.name))
                    || (step === 1 && field.name === "full_name");
                  if (field.name === "gender") {
                    return (
                      <div key={field.name}>
                        <Label className="text-[#475569] mb-1.5 block">{field.label}</Label>
                        <select
                          value={values.gender ?? ""}
                          onChange={(e) => setValue("gender", e.target.value)}
                          className="w-full bg-white border border-[#CBD5E1] text-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    );
                  }
                  return (
                    <div key={field.name} className={spanFull ? "col-span-2" : ""}>
                      <Label className="text-[#475569] mb-1.5 block">{field.label}</Label>
                      <Input
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        value={values[field.name] ?? ""}
                        onChange={(e) => setValue(field.name, e.target.value)}
                      />
                      {errors[field.name] && (
                        <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                      )}
                    </div>
                  );
                })}
                {step === 3 && (
                  <p className="text-[#64748B] text-xs">Leave blank if not taken. You can update later.</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-[#475569] mb-1.5 block">Target Degree</Label>
                  <select
                    value={values.target_degree ?? "masters"}
                    onChange={(e) => setValue("target_degree", e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] text-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="bachelor">Bachelor&apos;s</option>
                    <option value="master">Master&apos;s</option>
                    <option value="phd">PhD</option>
                    <option value="diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[#475569] mb-1.5 block">Annual Budget (USD)</Label>
                  <Input type="number" placeholder="25000" value={values.budget_usd ?? ""}
                    onChange={(e) => setValue("budget_usd", e.target.value)} />
                </div>
                <div>
                  <Label className="text-[#475569] mb-1.5 block">Target Countries (comma-separated)</Label>
                  <Input placeholder="Canada, Germany, UK, Australia" value={values.target_countries ?? ""}
                    onChange={(e) => setValue("target_countries", e.target.value)} />
                </div>
                <div>
                  <Label className="text-[#475569] mb-1.5 block">Fields of Interest (comma-separated)</Label>
                  <Input placeholder="Computer Science, Data Science" value={values.target_fields ?? ""}
                    onChange={(e) => setValue("target_fields", e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}
                  className="flex-1">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex-1"
              >
                {step === 4 ? (submitting ? "Creating account..." : "Create Account") : (
                  <>Next <ChevronRight size={16} className="ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-[#64748B] text-sm mt-4">
          Already have an account?{" "}
          <Link href="/auth/login/student" className="text-[#10B981] hover:text-[#059669]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={null}>
      <StudentRegisterForm />
    </Suspense>
  );
}
