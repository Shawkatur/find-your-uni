"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import api from "@/lib/api";
import type { Student } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  ssc_gpa: z.coerce.number().optional(),
  hsc_gpa: z.coerce.number().optional(),
  bachelor_gpa: z.coerce.number().optional(),
  bachelor_institution: z.string().optional(),
  bachelor_field: z.string().optional(),
  ielts_score: z.coerce.number().optional(),
  toefl_score: z.coerce.number().optional(),
  gre_score: z.coerce.number().optional(),
  gmat_score: z.coerce.number().optional(),
  target_degree: z.enum(["bachelor", "master", "phd", "diploma"]).optional(),
  budget_usd: z.coerce.number().optional(),
  target_countries_str: z.string().optional(),
  target_fields_str: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function field(label: string, name: keyof FormData, type = "text", placeholder?: string) {
  return { label, name, type, placeholder };
}

export default function StudentProfilePage() {
  const qc = useQueryClient();

  const { data: student } = useQuery<Student>({
    queryKey: ["student-me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      const profile = res.data?.profile ?? res.data;
      // Flatten nested academic_history and test_scores for the form
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

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
      toast.success("Profile saved!");
      qc.invalidateQueries({ queryKey: ["student-me"] });
    },
    onError: () => toast.error("Failed to save profile."),
  });

  const inputClass = "bg-white/8 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500";

  const renderField = (label: string, name: keyof FormData, type = "text", placeholder?: string) => (
    <div key={name}>
      <Label className="text-slate-300 mb-1.5 block text-sm">{label}</Label>
      <Input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className={inputClass}
      />
      {errors[name] && <p className="text-red-400 text-xs mt-1">{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <PageWrapper
      title="My Profile"
      subtitle="Keep your academic profile up-to-date for better match results."
      actions={
        <Button
          onClick={handleSubmit((data) => saveMutation.mutate(data as FormData))}
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save size={15} className="mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <Tabs defaultValue="personal">
        <TabsList className="bg-white/8 border border-white/10 mb-6 flex-wrap">
          {["personal", "academics", "scores", "preferences"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 capitalize"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="personal">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderField("Full Name", "full_name", "text", "Your full name")}
              {renderField("Phone", "phone", "tel", "+880 17...")}
              {renderField("Nationality", "nationality", "text", "e.g. Bangladeshi")}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="academics">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderField("SSC GPA (out of 5.0)", "ssc_gpa", "number", "4.50")}
              {renderField("HSC GPA (out of 5.0)", "hsc_gpa", "number", "5.00")}
              {renderField("Bachelor GPA (out of 4.0)", "bachelor_gpa", "number", "3.75")}
              {renderField("Bachelor Institution", "bachelor_institution", "text", "e.g. BUET")}
              {renderField("Field of Study", "bachelor_field", "text", "e.g. Computer Science")}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="scores">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderField("IELTS Score (0–9)", "ielts_score", "number", "7.0")}
              {renderField("TOEFL Score (0–120)", "toefl_score", "number", "95")}
              {renderField("GRE Score (260–340)", "gre_score", "number", "320")}
              {renderField("GMAT Score (200–800)", "gmat_score", "number", "680")}
            </div>
            <p className="text-slate-500 text-xs mt-4">Leave blank if not applicable.</p>
          </GlassCard>
        </TabsContent>

        <TabsContent value="preferences">
          <GlassCard>
            <div className="space-y-5">
              <div>
                <Label className="text-slate-300 mb-1.5 block text-sm">Target Degree</Label>
                <select
                  {...register("target_degree")}
                  className="w-full bg-white/8 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
          </GlassCard>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
