import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { ApplicationCard } from "@/components/application/ApplicationCard";
import { useApplications } from "@/hooks/useApplications";
import { Application } from "@/types";

const FILTERS = [
  { label: "All", value: undefined },
  { label: "Active", value: "applied" },
  { label: "Offers", value: "offer_received" },
  { label: "Enrolled", value: "enrolled" },
];

export default function ApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: apps, isLoading } = useApplications(statusFilter);

  return (
    <ScreenWrapper>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-text-base text-xl font-black">Applications</Text>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-2"
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={String(f.value)}
              onPress={() => setStatusFilter(f.value)}
              className={`px-4 py-1.5 rounded-full border ${
                statusFilter === f.value
                  ? "bg-primary border-primary"
                  : "bg-surface border-white/10"
              }`}
            >
              <Text className={`text-sm font-semibold ${
                statusFilter === f.value ? "text-white" : "text-text-muted"
              }`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-muted">Loading...</Text>
          </View>
        )}

        {!isLoading && (!apps || apps.length === 0) && (
          <View className="flex-1 items-center justify-center px-6 gap-3">
            <Text className="text-4xl">📋</Text>
            <Text className="text-text-base font-bold text-lg">No applications yet</Text>
            <Text className="text-text-muted text-sm text-center">
              Apply to universities from your match results.
            </Text>
          </View>
        )}

        {apps && apps.length > 0 && (
          <FlashList
            data={apps}
            renderItem={({ item }) => <ApplicationCard item={item as Application} />}
            estimatedItemSize={100}
            keyExtractor={(item) => (item as Application).id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
