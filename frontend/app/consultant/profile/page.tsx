"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import api from "@/lib/api";
import type { Consultant } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  role_title: z.string().optional(),
  whatsapp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ConsultantProfilePage() {
  const qc = useQueryClient();

  const { data: consultant } = useQuery<Consultant>({
    queryKey: ["consultant-me"],
    queryFn: async () => {
      const res = await api.get("/consultants/me");
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (consultant) {
      reset({
        full_name: consultant.full_name,
        phone: consultant.phone,
        role_title: consultant.role_title,
        whatsapp: consultant.whatsapp,
      });
    }
  }, [consultant, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.patch("/consultants/me", data);
    },
    onSuccess: () => {
      toast.success("Profile saved!");
      qc.invalidateQueries({ queryKey: ["consultant-me"] });
    },
    onError: () => toast.error("Failed to save."),
  });

  const inputClass = "bg-white/8 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500";

  return (
    <PageWrapper
      title="Profile"
      subtitle="Manage your consultant profile."
      actions={
        <Button
          onClick={handleSubmit((data) => saveMutation.mutate(data))}
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save size={15} className="mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      }
    >
      <GlassCard className="max-w-lg">
        <div className="space-y-5">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Full Name</Label>
            <Input {...register("full_name")} placeholder="Your name" className={inputClass} />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Phone</Label>
            <Input {...register("phone")} type="tel" placeholder="+880 17..." className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Role / Title</Label>
            <Input {...register("role_title")} placeholder="e.g. Senior Consultant" className={inputClass} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">WhatsApp Number</Label>
            <Input {...register("whatsapp")} placeholder="+8801712345678" className={inputClass} />
            <p className="text-slate-500 text-xs mt-1">Students will contact you via WhatsApp deep link.</p>
          </div>
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
