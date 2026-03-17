import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 2 },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Listen for auth state changes and invalidate queries on session change
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0F19" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="match/[university_id]" options={{ presentation: "card" }} />
          <Stack.Screen name="applications/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="applications/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="applications/documents/upload" options={{ presentation: "modal" }} />
          <Stack.Screen name="consultants/[agency_id]" options={{ presentation: "card" }} />
          <Stack.Screen name="scholarships/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
