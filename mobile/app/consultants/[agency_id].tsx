import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { StarRating } from "@/components/consultant/StarRating";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { Agency, Consultant } from "@/types";

export default function AgencyDetail() {
  const router = useRouter();
  const { agency_id } = useLocalSearchParams<{ agency_id: string }>();

  const { data: agency } = useQuery<Agency>({
    queryKey: ["agency", agency_id],
    queryFn: () => api.get(`/agencies/${agency_id}`).then((r) => r.data),
    enabled: !!agency_id,
  });

  const { data: consultants } = useQuery<Consultant[]>({
    queryKey: ["agency-consultants", agency_id],
    queryFn: () => api.get(`/consultants?agency_id=${agency_id}`).then((r) => r.data ?? []),
    enabled: !!agency_id,
  });

  const openWhatsApp = () => {
    if (agency?.whatsapp) {
      Linking.openURL(`https://wa.me/${agency.whatsapp.replace(/\D/g, "")}`);
    }
  };

  if (!agency) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-text-muted text-xl">‹ Back</Text>
        </TouchableOpacity>

        {/* Agency header */}
        <GlassCard className="mb-4">
          <Text className="text-text-base text-xl font-black">{agency.name}</Text>
          {agency.city && (
            <Text className="text-text-muted text-sm mt-0.5">📍 {agency.city}</Text>
          )}
          <StarRating
            rating={agency.avg_rating}
            reviewCount={agency.review_count}
            size={14}
            className="mt-2"
          />
          {agency.license_no && (
            <Text className="text-text-muted text-xs mt-2">License: {agency.license_no}</Text>
          )}
        </GlassCard>

        {/* CTAs */}
        <View className="flex-row gap-3 mb-4">
          {agency.whatsapp && (
            <Button
              title="💬 WhatsApp"
              variant="secondary"
              onPress={openWhatsApp}
              className="flex-1"
            />
          )}
          <Button
            title="★ Reviews"
            variant="ghost"
            onPress={() => router.push(`/consultants/${agency_id}/reviews`)}
            className="flex-1"
          />
        </View>

        {/* Consultants */}
        {consultants && consultants.length > 0 && (
          <View>
            <Text className="text-text-base font-bold mb-3">Team ({consultants.length})</Text>
            {consultants.map((c) => (
              <GlassCard key={c.id} className="mb-2 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold">
                    {c.full_name[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-base font-semibold">{c.full_name}</Text>
                  <Text className="text-text-muted text-xs capitalize">{c.role}</Text>
                </View>
                {c.whatsapp && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://wa.me/${c.whatsapp!.replace(/\D/g, "")}`)}
                  >
                    <Text className="text-accent text-xl">💬</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
