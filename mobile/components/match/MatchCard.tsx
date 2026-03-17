import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { MatchResultItem } from "@/types";
import { COUNTRY_FLAG } from "@/lib/countries";

interface Props {
  item: MatchResultItem;
  index: number;
}

export function MatchCard({ item, index }: Props) {
  const router = useRouter();
  const { university, program, score, ai_summary } = item;
  const flag = COUNTRY_FLAG[university.country] ?? "🌍";

  return (
    <Pressable
      onPress={() => router.push(`/match/${university.id}?program_id=${program.id}`)}
      className="mb-3"
    >
      <GlassCard>
        <View className="flex-row items-start gap-3">
          {/* Rank number */}
          <View className="w-7 items-center mt-1">
            <Text className="text-text-muted text-sm font-bold">#{index + 1}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-text-muted text-lg">{flag}</Text>
              <Text className="text-text-base font-bold text-base flex-1" numberOfLines={1}>
                {university.name}
              </Text>
            </View>

            <Text className="text-text-muted text-sm mt-0.5" numberOfLines={1}>
              {program.name} · {program.degree_level.toUpperCase()}
            </Text>

            {university.tuition_usd_per_year > 0 ? (
              <Text className="text-accent text-sm font-semibold mt-1">
                ${university.tuition_usd_per_year.toLocaleString()}/yr
              </Text>
            ) : (
              <Text className="text-accent text-sm font-semibold mt-1">€0 Tuition 🇩🇪</Text>
            )}

            {ai_summary ? (
              <Text className="text-text-muted text-xs mt-2 leading-4" numberOfLines={2}>
                {ai_summary}
              </Text>
            ) : null}
          </View>

          {/* Score */}
          <ScoreBadge score={score.total} size="md" />
        </View>
      </GlassCard>
    </Pressable>
  );
}
