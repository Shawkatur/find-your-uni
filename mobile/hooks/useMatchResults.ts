import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { MatchResultItem } from "@/types";

export function useMatchResults() {
  return useQuery<MatchResultItem[]>({
    queryKey: ["match", "results"],
    queryFn: async () => {
      const { data } = await api.get("/match/results");
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRunMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/match");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match"] });
    },
  });
}
