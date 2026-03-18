"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import type { University } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/layout/GlassCard";
import { Save } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  ranking_qs: z.coerce.number().optional().or(z.literal("")),
  acceptance_rate_overall: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  acceptance_rate_bd: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  tuition_usd_per_year: z.coerce.number().optional().or(z.literal("")),
  min_ielts: z.coerce.number().optional().or(z.literal("")),
  min_toefl: z.coerce.number().optional().or(z.literal("")),
  min_gpa_percentage: z.coerce.number().optional().or(z.literal("")),
  scholarships_available: z.boolean().optional(),
  description: z.string().optional(),
});

export type UniversityFormData = z.infer<typeof schema>;

interface UniversityFormProps {
  defaultValues?: Partial<University>;
  onSubmit: (data: UniversityFormData) => void;
  isSubmitting?: boolean;
}

export function UniversityForm({ defaultValues, onSubmit, isSubmitting }: UniversityFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UniversityFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name,
        country: defaultValues.country,
        city: defaultValues.city,
        website: defaultValues.website,
        ranking_qs: defaultValues.ranking_qs,
        acceptance_rate_overall: defaultValues.acceptance_rate_overall,
        acceptance_rate_bd: defaultValues.acceptance_rate_bd,
        tuition_usd_per_year: defaultValues.tuition_usd_per_year,
        min_ielts: defaultValues.min_ielts,
        min_toefl: defaultValues.min_toefl,
        min_gpa_percentage: defaultValues.min_gpa_percentage,
        scholarships_available: defaultValues.scholarships_available,
        description: defaultValues.description,
      });
    }
  }, [defaultValues, reset]);

  const inputClass = "bg-white/8 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      {/* Basic Info */}
      <GlassCard>
        <h3 className="text-white font-semibold mb-5">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label className="text-slate-300 mb-1.5 block">University Name *</Label>
            <Input {...register("name")} placeholder="e.g. University of Toronto" className={inputClass} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Country *</Label>
            <Input {...register("country")} placeholder="e.g. Canada" className={inputClass} />
            {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country.message}</p>}
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">City</Label>
            <Input {...register("city")} placeholder="e.g. Toronto" className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-slate-300 mb-1.5 block">Website</Label>
            <Input {...register("website")} type="url" placeholder="https://..." className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-slate-300 mb-1.5 block">Description</Label>
            <Textarea {...register("description")} rows={3} placeholder="Brief description..."
              className={`${inputClass} resize-none`} />
          </div>
        </div>
      </GlassCard>

      {/* Rankings & Stats */}
      <GlassCard>
        <h3 className="text-white font-semibold mb-5">Rankings & Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <Label className="text-slate-300 mb-1.5 block">QS Rank</Label>
            <Input {...register("ranking_qs")} type="number" placeholder="e.g. 21" className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Acceptance Rate (%)</Label>
            <Input {...register("acceptance_rate_overall")} type="number" step="0.1" placeholder="35.0" className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">BD Acceptance Rate (%)</Label>
            <Input {...register("acceptance_rate_bd")} type="number" step="0.1" placeholder="15.0" className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Annual Tuition (USD)</Label>
            <Input {...register("tuition_usd_per_year")} type="number" placeholder="35000" className={inputClass} />
          </div>
        </div>
      </GlassCard>

      {/* Requirements */}
      <GlassCard>
        <h3 className="text-white font-semibold mb-5">Minimum Requirements</h3>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <Label className="text-slate-300 mb-1.5 block">IELTS Min</Label>
            <Input {...register("min_ielts")} type="number" step="0.5" placeholder="6.5" className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">TOEFL Min</Label>
            <Input {...register("min_toefl")} type="number" placeholder="85" className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">GPA Min (%)</Label>
            <Input {...register("min_gpa_percentage")} type="number" step="0.01" placeholder="65" className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("scholarships_available")}
              className="w-4 h-4 rounded border-white/20 bg-white/8 accent-blue-600"
            />
            <span className="text-slate-300 text-sm">Scholarships Available</span>
          </label>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          <Save size={15} className="mr-2" />
          {isSubmitting ? "Saving..." : "Save University"}
        </Button>
      </div>
    </form>
  );
}
