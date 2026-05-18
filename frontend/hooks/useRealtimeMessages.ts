"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import api from "@/lib/api";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  student_id: string;
  consultant_id: string;
  sender_type: "student" | "consultant";
  content: string;
  is_read: boolean;
  created_at: string;
}

interface UseRealtimeMessagesOptions {
  /** Whether the subscription should be active */
  enabled: boolean;
  /** Student ID to filter messages for */
  studentId?: string;
  /** Consultant ID to filter messages for */
  consultantId?: string;
}

interface UseRealtimeMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  sending: boolean;
  error: string | null;
}

export function useRealtimeMessages({
  enabled,
  studentId,
  consultantId,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial messages from the API
  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchMessages() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/messages");
        if (!cancelled) {
          setMessages(res.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load messages");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Subscribe to realtime INSERT events on the messages table
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    // Build the subscription filter. When both student_id and consultant_id
    // are known we scope the channel to that conversation pair. Otherwise we
    // listen for all inserts and rely on the initial fetch being scoped by
    // the API (which already filters by the authenticated user).
    let filter: string | undefined;
    if (studentId && consultantId) {
      filter = `student_id=eq.${studentId}`;
    }

    const channelName = `messages-realtime-${studentId ?? "all"}-${consultantId ?? "all"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // When filtering by consultant, skip messages from other conversations
          if (consultantId && newMsg.consultant_id !== consultantId) return;

          setMessages((prev) => {
            // Deduplicate — the optimistic insert from sendMessage may
            // already have added this message.
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [enabled, studentId, consultantId]);

  // Send a message via the REST API and optimistically append it
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      setSending(true);
      setError(null);

      try {
        const res = await api.post("/messages", { content: trimmed });
        const saved: Message | undefined = res.data;

        if (saved?.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === saved.id)) return prev;
            return [...prev, saved];
          });
        }
      } catch {
        setError("Failed to send message");
        throw new Error("Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [],
  );

  return { messages, loading, sendMessage, sending, error };
}
