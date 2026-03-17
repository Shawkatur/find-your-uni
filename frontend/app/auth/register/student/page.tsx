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

// Minimal field type for steps
interface FieldDef {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

const stepTitles = ["Account", "Personal Info", "Academics", "Test Scores", "Preferences"];

type FormValues = Record<string, string>;

// Simple validation per step
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

function StudentRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? undefined;
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
      if (authErr) throw authErr;

      // Attach the new session token so the backend accepts the request
      const session = authData.session;
      const headers = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      await api.post("/auth/student/register", {
        full_name: values.full_name,
        phone: values.phone || undefined,
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
        preferred_countries: values.target_countries?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) ?? [],
        preferred_fields:    values.target_fields?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
        ref_code:            refCode,
      }, { headers });

      toast.success("Account created! Welcome aboard.");
      router.push("/student/dashboard");
    } catch (err: unknown) {
      // 409 = profile already exists (e.g. during testing with BYPASS_AUTH)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.response?.status === 409) {
        toast.success("Welcome back! Redirecting…");
        router.push("/student/dashboard");
        return;
      }
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / 5) * 100;
  const inputClass = "bg-white/8 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500";

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
            <GraduationCap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Student Registration</h1>
          <p className="text-slate-400 text-sm mt-1">Step {step + 1} of 5 — {stepTitles[step]}</p>
        </div>

        <Progress value={progress} className="mb-6 h-1.5 bg-white/10" />

        <div className="flex justify-between mb-8 px-2">
          {stepTitles.map((title, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                i < step ? "bg-green-600 text-white" :
                i === step ? "bg-blue-600 text-white ring-2 ring-blue-400/30" :
                "bg-white/10 text-slate-500"
              )}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:block", i === step ? "text-white" : "text-slate-500")}>
                {title}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          <div className="space-y-5">
            {/* Steps 0-3: render fields from stepFields array */}
            {step < 4 && (
              <div className={step === 2 ? "grid grid-cols-2 gap-4" : "space-y-5"}>
                {stepFields[step].map((field) => (
                  <div key={field.name} className={step === 2 && ["bachelor_institution", "bachelor_field"].includes(field.name) ? "col-span-2" : ""}>
                    <Label className="text-slate-300 mb-1.5 block">{field.label}</Label>
                    <Input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                      className={inputClass}
                    />
                    {errors[field.name] && (
                      <p className="text-red-400 text-xs mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
                {step === 3 && (
                  <p className="text-slate-500 text-xs">Leave blank if not taken. You can update later.</p>
                )}
              </div>
            )}

            {/* Step 4: Preferences */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Target Degree</Label>
                  <select
                    value={values.target_degree ?? "masters"}
                    onChange={(e) => setValue("target_degree", e.target.value)}
                    className="w-full bg-white/8 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="bachelor">Bachelor&apos;s</option>
                    <option value="master">Master&apos;s</option>
                    <option value="phd">PhD</option>
                    <option value="diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Annual Budget (USD)</Label>
                  <Input type="number" placeholder="25000" value={values.budget_usd ?? ""}
                    onChange={(e) => setValue("budget_usd", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Target Countries (comma-separated)</Label>
                  <Input placeholder="USA, UK, Canada, Germany" value={values.target_countries ?? ""}
                    onChange={(e) => setValue("target_countries", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Fields of Interest (comma-separated)</Label>
                  <Input placeholder="Computer Science, Data Science" value={values.target_fields ?? ""}
                    onChange={(e) => setValue("target_fields", e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}
                  className="flex-1 border-white/10 text-slate-300 hover:bg-white/8">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {step === 4 ? (submitting ? "Creating account..." : "Create Account") : (
                  <>Next <ChevronRight size={16} className="ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
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
