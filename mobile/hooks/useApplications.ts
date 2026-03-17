import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Application } from "@/types";

export function useApplications(status?: string) {
  return useQuery<Application[]>({
    queryKey: ["applications", status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const { data } = await api.get("/applications", { params });
      return data ?? [];
    },
  });
}

export function useApplication(id: string) {
  return useQuery<Application>({
    queryKey: ["application", id],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      student_id: string;
      program_id?: string;
      consultant_id?: string;
      agency_id?: string;
      notes?: string;
    }) => {
      const { data } = await api.post("/applications", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
