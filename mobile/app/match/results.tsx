import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { MatchCard } from "@/components/match/MatchCard";
import { useMatchResults } from "@/hooks/useMatchResults";
import { MatchResultItem } from "@/types";

export default function MatchResults() {
  const router = useRouter();
  const { data: results, isLoading, refetch } = useMatchResults();

  return (
    <ScreenWrapper>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pt-6 pb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-text-muted text-xl">‹</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-text-base text-xl font-black">All Matches</Text>
            {results && (
              <Text className="text-text-muted text-xs">{results.length} universities</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push("/match/run")}>
            <Text className="text-primary text-sm font-semibold">Re-run</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-muted">Loading...</Text>
          </View>
        )}

        {results && results.length > 0 && (
          <FlashList
            data={results}
            renderItem={({ item, index }) => (
              <MatchCard item={item as MatchResultItem} index={index} />
            )}
            estimatedItemSize={130}
            keyExtractor={(item) => (item as MatchResultItem).university.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
