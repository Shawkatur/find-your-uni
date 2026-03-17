import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  registerForPushNotificationsAsync,
  registerTokenWithBackend,
} from "@/lib/notifications";

/**
 * On mount: request push permission, get Expo token, and register with backend.
 * Re-runs when `authenticated` changes from false → true.
 */
export function usePushToken(authenticated: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!authenticated || registered.current) return;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await registerTokenWithBackend(token);
        registered.current = true;
      }
    })();
  }, [authenticated]);
}
