import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/onboarding/welcome");
      return;
    }

    // Check if student profile + onboarding complete
    api.get("/auth/me")
      .then(({ data }) => {
        const profile = data.profile;
        if (!profile || !profile.onboarding_completed) {
          router.replace("/setup/step-1-degree");
        } else {
          router.replace("/(tabs)");
        }
      })
      .catch(() => {
        // No profile yet → setup wizard
        router.replace("/setup/step-1-degree");
      });
  }, [session, loading]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}
