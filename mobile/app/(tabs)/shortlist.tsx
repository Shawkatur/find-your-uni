import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import api from "@/lib/api";

interface ShortlistItem {
  id: string;
  university_id: string;
  program_name: string | null;
  note: string | null;
  university: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    ranking_qs: number | null;
    tuition_usd_per_year: number | null;
  } | null;
}

export default function ShortlistScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ShortlistItem[]>({
    queryKey: ["shortlist"],
    queryFn: () => api.get("/shortlist").then((r) => r.data ?? []),
  });

  const removeMutation = useMutation({
    mutationFn: (universityId: string) => api.delete(`/shortlist/${universityId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortlist"] });
    },
  });

  return (
    <ScreenWrapper>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-text-base text-2xl font-black">My Shortlist</Text>
        <Text className="text-text-muted text-sm mt-1">
          {items.length > 0
            ? `${items.length} saved uni${items.length === 1 ? "" : "s"}`
            : "Save unis from Match to compare here"}
        </Text>
      </View>

      {isLoading ? (
        <View className="items-center justify-center py-16">
          <Text className="text-text-muted text-sm">Loading...</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="items-center justify-center py-16 px-6">
          <Text className="text-4xl mb-3">🔖</Text>
          <Text className="text-text-base text-lg font-bold text-center">No unis saved yet</Text>
          <Text className="text-text-muted text-sm text-center mt-2">
            Run a match or browse universities to find your best fits.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/match")}
            className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-bold text-sm">Start Matching</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          renderItem={({ item }) => {
            const uni = item.university;
            if (!uni) return null;
            return (
              <TouchableOpacity
                onPress={() => router.push(`/match/${uni.id}`)}
                className="bg-surface-card rounded-2xl p-4 border border-border-subtle"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-text-base font-bold text-sm" numberOfLines={2}>
                      {uni.name}
                    </Text>
                    <Text className="text-text-muted text-xs mt-1">
                      {uni.city ? `${uni.city}, ` : ""}
                      {uni.country}
                    </Text>
                    {item.program_name && (
                      <Text className="text-indigo-400 text-xs font-medium mt-1.5">
                        {item.program_name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeMutation.mutate(item.university_id)}
                    className="w-8 h-8 items-center justify-center rounded-full bg-red-500/10"
                  >
                    <Text className="text-red-400 text-xs font-bold">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2 mt-3 flex-wrap">
                  {uni.ranking_qs && (
                    <View className="bg-amber-500/10 px-2.5 py-1 rounded-full">
                      <Text className="text-amber-400 text-[10px] font-bold">
                        QS #{uni.ranking_qs}
                      </Text>
                    </View>
                  )}
                  {uni.tuition_usd_per_year && (
                    <View className="bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <Text className="text-emerald-400 text-[10px] font-bold">
                        ${uni.tuition_usd_per_year.toLocaleString()}/yr
                      </Text>
                    </View>
                  )}
                </View>

                {item.note && (
                  <Text className="text-text-muted text-xs mt-2 italic" numberOfLines={2}>
                    {item.note}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}
