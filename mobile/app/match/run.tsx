import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { useRunMatch } from "@/hooks/useMatchResults";

export default function RunMatch() {
  const router = useRouter();
  const runMatch = useRunMatch();

  useEffect(() => {
    runMatch.mutate(undefined, {
      onSuccess: () => router.replace("/match/results"),
      onError: () => router.back(),
    });
  }, []);

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
        <View className="items-center gap-2">
          <Text className="text-text-base text-xl font-black">Finding Your Matches</Text>
          <Text className="text-text-muted text-sm text-center">
            Scoring thousands of programs by ranking, cost efficiency, and BD acceptance rate...
          </Text>
        </View>
        <Text className="text-text-muted text-xs">✨ AI summaries generating</Text>
      </View>
    </ScreenWrapper>
  );
}
