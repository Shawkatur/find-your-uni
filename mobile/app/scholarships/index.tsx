import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import api from "@/lib/api";
import { Scholarship } from "@/types";
import { COUNTRY_FLAG } from "@/lib/countries";

const DEGREE_FILTERS = [
  { label: "All", value: undefined },
  { label: "Master's", value: "master" },
  { label: "PhD", value: "phd" },
  { label: "Bachelor's", value: "bachelor" },
];

export default function ScholarshipsIndex() {
  const router = useRouter();
  const [degreeFilter, setDegreeFilter] = useState<string | undefined>(undefined);

  const { data: scholarships, isLoading } = useQuery<Scholarship[]>({
    queryKey: ["scholarships", degreeFilter],
    queryFn: () =>
      api.get("/scholarships", { params: { degree: degreeFilter, bd_eligible: true } })
        .then((r) => r.data ?? []),
  });

  return (
    <ScreenWrapper>
      <View className="flex-1">
        <View className="px-5 pt-6 pb-2">
          <Text className="text-text-base text-xl font-black">Scholarships</Text>
          <Text className="text-text-muted text-sm mt-0.5">BD-eligible funding opportunities</Text>
        </View>

        {/* Degree filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-3"
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          {DEGREE_FILTERS.map((f) => (
            <TouchableOpacity
              key={String(f.value)}
              onPress={() => setDegreeFilter(f.value)}
              className={`px-4 py-1.5 rounded-full border ${
                degreeFilter === f.value
                  ? "bg-primary border-primary"
                  : "bg-surface border-white/10"
              }`}
            >
              <Text className={`text-sm font-semibold ${
                degreeFilter === f.value ? "text-white" : "text-text-muted"
              }`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-muted">Loading scholarships...</Text>
          </View>
        )}

        {scholarships && (
          <FlashList
            data={scholarships}
            renderItem={({ item }) => {
              const s = item as Scholarship;
              const flag = s.country ? (COUNTRY_FLAG[s.country] ?? "🌍") : "🌐";
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/scholarships/${s.id}`)}
                  className="mx-5 mb-3"
                >
                  <GlassCard>
                    <View className="flex-row items-start gap-3">
                      <Text className="text-2xl">{flag}</Text>
                      <View className="flex-1">
                        <Text className="text-text-base font-bold text-base" numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text className="text-text-muted text-xs mt-0.5">{s.provider}</Text>
                        <View className="flex-row flex-wrap gap-1.5 mt-2">
                          {s.is_fully_funded && (
                            <View className="bg-accent/20 px-2 py-0.5 rounded-full">
                              <Text className="text-accent text-xs font-semibold">Fully Funded</Text>
                            </View>
                          )}
                          {s.degree_levels.map((d) => (
                            <View key={d} className="bg-primary/20 px-2 py-0.5 rounded-full">
                              <Text className="text-primary text-xs capitalize">{d}</Text>
                            </View>
                          ))}
                          {s.deadline && (
                            <View className="bg-amber/20 px-2 py-0.5 rounded-full">
                              <Text className="text-amber text-xs">
                                Due {new Date(s.deadline).toLocaleDateString("en-BD", {
                                  day: "numeric", month: "short",
                                })}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            }}
            estimatedItemSize={120}
            keyExtractor={(item) => (item as Scholarship).id}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
