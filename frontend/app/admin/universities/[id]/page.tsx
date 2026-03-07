"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { University } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { UniversityForm, UniversityFormData } from "@/components/admin/UniversityForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function EditUniversityPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: university, isLoading } = useQuery<University>({
    queryKey: ["university-admin", id],
    queryFn: async () => {
      const res = await api.get(`/universities/${id}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UniversityFormData) => {
      await api.patch(`/universities/${id}`, data);
    },
    onSuccess: () => {
      toast.success("University updated!");
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      qc.invalidateQueries({ queryKey: ["university-admin", id] });
      router.push("/admin/universities");
    },
    onError: () => toast.error("Failed to update university."),
  });

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <PageWrapper title="Edit University" subtitle={university?.name}>
      <div className="max-w-3xl">
        <UniversityForm
          defaultValues={university}
          onSubmit={(data) => updateMutation.mutate(data)}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </PageWrapper>
  );
}
