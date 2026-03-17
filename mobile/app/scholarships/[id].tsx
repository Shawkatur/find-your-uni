import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { COUNTRY_FLAG, COUNTRY_NAME } from "@/lib/countries";
import api from "@/lib/api";
import { Scholarship } from "@/types";

export default function ScholarshipDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: scholarship } = useQuery<Scholarship>({
    queryKey: ["scholarship", id],
    queryFn: () => api.get(`/scholarships/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post(`/scholarships/${id}/save`),
  });

  if (!scholarship) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const flag = scholarship.country ? (COUNTRY_FLAG[scholarship.country] ?? "🌍") : "🌐";
  const countryName = scholarship.country
    ? (COUNTRY_NAME[scholarship.country] ?? scholarship.country)
    : "International";

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-text-muted text-xl">‹ Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="flex-row items-start gap-3 mb-4">
          <Text className="text-4xl">{flag}</Text>
          <View className="flex-1">
            <Text className="text-text-base text-xl font-black leading-tight">
              {scholarship.name}
            </Text>
            <Text className="text-text-muted text-sm mt-0.5">{scholarship.provider}</Text>
            <Text className="text-text-muted text-xs mt-0.5">{countryName}</Text>
          </View>
        </View>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {scholarship.is_fully_funded && (
            <View className="bg-accent/20 px-3 py-1 rounded-full">
              <Text className="text-accent text-sm font-semibold">💰 Fully Funded</Text>
            </View>
          )}
          {scholarship.amount_usd && (
            <View className="bg-amber/20 px-3 py-1 rounded-full">
              <Text className="text-amber text-sm font-semibold">
                ${scholarship.amount_usd.toLocaleString()}
              </Text>
            </View>
          )}
          {scholarship.bd_eligible && (
            <View className="bg-primary/20 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-semibold">🇧🇩 BD Eligible</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <GlassCard className="mb-4">
          <Row label="Degree Levels" value={scholarship.degree_levels.join(", ").toUpperCase()} />
          {scholarship.deadline && (
            <Row
              label="Deadline"
              value={new Date(scholarship.deadline).toLocaleDateString("en-BD", {
                day: "numeric", month: "long", year: "numeric",
              })}
            />
          )}
          {scholarship.fields.length > 0 && scholarship.fields[0] !== "any" && (
            <Row label="Fields" value={scholarship.fields.join(", ")} />
          )}
        </GlassCard>

        {/* Action buttons */}
        <View className="gap-3">
          {scholarship.application_url && (
            <Button
              title="Apply Now →"
              onPress={() => Linking.openURL(scholarship.application_url!)}
            />
          )}
          <Button
            title="Bookmark"
            variant="secondary"
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-white/5">
      <Text className="text-text-muted text-sm">{label}</Text>
      <Text className="text-text-base text-sm font-semibold flex-1 text-right ml-4">{value}</Text>
    </View>
  );
}
