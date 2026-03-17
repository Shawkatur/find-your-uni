import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { MatchCard } from "@/components/match/MatchCard";
import { Button } from "@/components/ui/Button";
import { useMatchResults } from "@/hooks/useMatchResults";
import { MatchResultItem } from "@/types";

export default function MatchTab() {
  const router = useRouter();
  const { data: results, isLoading, refetch } = useMatchResults();

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">Loading matches...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!results || results.length === 0) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center px-6 gap-6">
          <Text className="text-5xl">🎯</Text>
          <View className="items-center gap-2">
            <Text className="text-text-base text-xl font-bold">No matches yet</Text>
            <Text className="text-text-muted text-sm text-center">
              Run the AI engine to find universities matched to your profile.
            </Text>
          </View>
          <Button title="Find My Universities" onPress={() => router.push("/match/run")} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center justify-between py-5">
          <View>
            <Text className="text-text-base text-xl font-black">Your Matches</Text>
            <Text className="text-text-muted text-sm">{results.length} universities found</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/match/run")}
            className="bg-primary/20 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-primary text-sm font-semibold">Re-run ↺</Text>
          </TouchableOpacity>
        </View>

        <FlashList
          data={results}
          renderItem={({ item, index }) => (
            <MatchCard item={item as MatchResultItem} index={index} />
          )}
          estimatedItemSize={130}
          keyExtractor={(item) => (item as MatchResultItem).university.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </ScreenWrapper>
  );
}
