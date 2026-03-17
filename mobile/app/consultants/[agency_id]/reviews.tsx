import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { StarRating } from "@/components/consultant/StarRating";
import api from "@/lib/api";
import { Review } from "@/types";

export default function AgencyReviews() {
  const router = useRouter();
  const { agency_id } = useLocalSearchParams<{ agency_id: string }>();

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["reviews", agency_id],
    queryFn: () => api.get(`/agencies/${agency_id}/reviews`).then((r) => r.data ?? []),
    enabled: !!agency_id,
  });

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-text-muted text-xl">‹ Back</Text>
        </TouchableOpacity>

        <Text className="text-text-base text-xl font-black mb-4">Reviews</Text>

        {!reviews || reviews.length === 0 ? (
          <Text className="text-text-muted text-center mt-8">No reviews yet</Text>
        ) : (
          reviews.map((review) => (
            <GlassCard key={review.id} className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <StarRating rating={review.rating} size={14} />
                <Text className="text-text-muted text-xs">
                  {new Date(review.created_at).toLocaleDateString("en-BD", {
                    month: "short", year: "numeric",
                  })}
                </Text>
              </View>
              {review.is_verified && (
                <Text className="text-accent text-xs mb-1">✓ Verified Student</Text>
              )}
              {review.comment && (
                <Text className="text-text-base text-sm leading-5">{review.comment}</Text>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
