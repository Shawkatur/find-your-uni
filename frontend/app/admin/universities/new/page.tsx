"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { UniversityForm, UniversityFormData } from "@/components/admin/UniversityForm";

export default function NewUniversityPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: UniversityFormData) => {
      await api.post("/universities", data);
    },
    onSuccess: () => {
      toast.success("University created!");
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      router.push("/admin/universities");
    },
    onError: () => toast.error("Failed to create university."),
  });

  return (
    <PageWrapper title="Add University" subtitle="Add a new university to the database.">
      <div className="max-w-3xl">
        <UniversityForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </PageWrapper>
  );
}
