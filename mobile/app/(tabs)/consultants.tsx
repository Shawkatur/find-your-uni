import { Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { AgencyCard } from "@/components/consultant/AgencyCard";
import api from "@/lib/api";
import { Agency } from "@/types";

export default function ConsultantsTab() {
  const [search, setSearch] = useState("");

  const { data: agencies, isLoading } = useQuery<Agency[]>({
    queryKey: ["agencies"],
    queryFn: () => api.get("/agencies").then((r) => r.data ?? []),
  });

  const filtered = agencies?.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <ScreenWrapper>
      <View className="flex-1">
        <View className="px-5 pt-6 pb-3">
          <Text className="text-text-base text-xl font-black mb-3">Find a Consultant</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search agencies..."
            placeholderTextColor="#6B7280"
            className="bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text-base"
          />
        </View>

        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-muted">Loading agencies...</Text>
          </View>
        )}

        {!isLoading && filtered.length === 0 && (
          <View className="flex-1 items-center justify-center px-6 gap-3">
            <Text className="text-4xl">🤝</Text>
            <Text className="text-text-muted text-center">No agencies found</Text>
          </View>
        )}

        {filtered.length > 0 && (
          <FlashList
            data={filtered}
            renderItem={({ item }) => <AgencyCard agency={item as Agency} />}
            estimatedItemSize={110}
            keyExtractor={(item) => (item as Agency).id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
