import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AppNotification } from "@/types";

type NotificationHandler = (notification: AppNotification) => void;

/**
 * Subscribe to Supabase Realtime status updates for the current student.
 * Calls `onNotification` when the consultant updates an application status.
 */
export function useRealtime(studentUserId: string | undefined, onNotification: NotificationHandler) {
  useEffect(() => {
    if (!studentUserId) return;

    const channel = supabase.channel(`application:${studentUserId}`);

    channel
      .on("broadcast", { event: "status_update" }, (payload) => {
        onNotification({
          ...(payload.payload as Omit<AppNotification, "received_at">),
          received_at: new Date().toISOString(),
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentUserId, onNotification]);
}
