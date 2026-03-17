import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { StarRating } from "./StarRating";
import { Agency } from "@/types";
import { Linking } from "react-native";

interface Props {
  agency: Agency;
}

export function AgencyCard({ agency }: Props) {
  const router = useRouter();

  const openWhatsApp = () => {
    if (agency.whatsapp) {
      const phone = agency.whatsapp.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${phone}`);
    }
  };

  return (
    <Pressable onPress={() => router.push(`/consultants/${agency.id}`)} className="mb-3">
      <GlassCard>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-text-base font-bold text-base" numberOfLines={1}>
              {agency.name}
            </Text>
            {agency.city && (
              <Text className="text-text-muted text-sm mt-0.5">
                📍 {agency.city}{agency.city !== agency.name ? `, ${agency.name}` : ""}
              </Text>
            )}
            <StarRating rating={agency.avg_rating} reviewCount={agency.review_count} className="mt-1.5" />
          </View>
          {agency.whatsapp && (
            <TouchableOpacity
              onPress={openWhatsApp}
              className="bg-accent/20 px-3 py-1.5 rounded-lg ml-2"
            >
              <Text className="text-accent text-xs font-semibold">WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}
