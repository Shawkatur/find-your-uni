"use client";

import { Bookmark } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ShortlistButtonProps {
  universityId: string;
  /** Pass studentId when a consultant is acting on behalf of a student */
  studentId?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ShortlistButton({
  universityId,
  studentId,
  size = "md",
  className,
}: ShortlistButtonProps) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const isConsultant = !!studentId;
  const checkUrl = isConsultant
    ? null // consultant check not needed — we use optimistic state only
    : `/shortlist/check/${universityId}`;

  const { data } = useQuery<{ saved: boolean }>({
    queryKey: ["shortlist-check", universityId, studentId],
    queryFn: async () => {
      if (!checkUrl) return { saved: false };
      const res = await api.get(checkUrl);
      return res.data;
    },
    enabled: !!user && !isConsultant,
    staleTime: 30_000,
  });

  const saved = data?.saved ?? false;

  const addMutation = useMutation({
    mutationFn: async () => {
      const url = isConsultant
        ? `/students/${studentId}/shortlist`
        : "/shortlist";
      await api.post(url, { university_id: universityId });
    },
    onSuccess: () => {
      toast.success("Added to shortlist");
      qc.invalidateQueries({ queryKey: ["shortlist-check", universityId] });
      qc.invalidateQueries({ queryKey: ["shortlist"] });
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.info("Already in shortlist");
      else toast.error("Failed to update shortlist");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const url = isConsultant
        ? `/students/${studentId}/shortlist/${universityId}`
        : `/shortlist/${universityId}`;
      await api.delete(url);
    },
    onSuccess: () => {
      toast.success("Removed from shortlist");
      qc.invalidateQueries({ queryKey: ["shortlist-check", universityId] });
      qc.invalidateQueries({ queryKey: ["shortlist"] });
      qc.invalidateQueries({ queryKey: ["student-shortlist", studentId] });
    },
    onError: () => toast.error("Failed to update shortlist"),
  });

  // Don't render for unauthenticated users
  if (!user) return null;

  const isPending = addMutation.isPending || removeMutation.isPending;
  const iconSize = size === "sm" ? 14 : 16;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    if (saved) removeMutation.mutate();
    else addMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={saved ? "Remove from shortlist" : "Save to shortlist"}
      className={cn(
        "flex items-center justify-center rounded-lg transition-all",
        size === "sm" ? "w-7 h-7" : "w-9 h-9",
        saved
          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30"
          : "bg-white/8 text-slate-400 border border-white/10 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/30",
        isPending && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Bookmark
        size={iconSize}
        className={cn("transition-all", saved ? "fill-current" : "")}
      />
    </button>
  );
}
