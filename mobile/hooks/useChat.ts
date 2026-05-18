import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  student_id: string;
  consultant_id: string;
  sender_type: "student" | "consultant";
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConsultantInfo {
  assigned: boolean;
  consultant?: {
    id: string;
    full_name: string;
    phone?: string;
    role_title?: string;
    whatsapp?: string;
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useChat() {
  const qc = useQueryClient();

  // Fetch consultant info
  const {
    data: consultantInfo,
    isLoading: consultantLoading,
  } = useQuery<ConsultantInfo>({
    queryKey: ["chat-consultant"],
    queryFn: () => api.get("/messages/consultant-info").then((r) => r.data),
  });

  // Fetch messages (only when a consultant is assigned)
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages"],
    queryFn: () => api.get("/messages").then((r) => r.data ?? []),
    enabled: !!consultantInfo?.assigned,
  });

  // Send a message
  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post("/messages", { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (trimmed) {
        sendMutation.mutate(trimmed);
      }
    },
    [sendMutation],
  );

  // Subscribe to Supabase Realtime for new messages
  useEffect(() => {
    const channel = supabase
      .channel("mobile-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["chat-messages"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Sort messages chronologically (oldest first)
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return {
    messages: sorted,
    loading: consultantLoading || messagesLoading,
    sendMessage,
    sending: sendMutation.isPending,
    consultantInfo: consultantInfo ?? null,
  };
}
