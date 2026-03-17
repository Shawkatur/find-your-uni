import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Application } from "@/types";
import { COUNTRY_FLAG } from "@/lib/countries";

interface Props {
  item: Application;
}

export function ApplicationCard({ item }: Props) {
  const router = useRouter();
  const uni = item.programs?.universities;
  const prog = item.programs;

  return (
    <Pressable onPress={() => router.push(`/applications/${item.id}`)} className="mb-3">
      <GlassCard>
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              {uni?.country && (
                <Text className="text-base">{COUNTRY_FLAG[uni.country] ?? "🌍"}</Text>
              )}
              <Text className="text-text-base font-bold text-base flex-1" numberOfLines={1}>
                {uni?.name ?? "University"}
              </Text>
            </View>
            {prog && (
              <Text className="text-text-muted text-sm mt-0.5" numberOfLines={1}>
                {prog.name} · {prog.degree_level?.toUpperCase()}
              </Text>
            )}
            <Text className="text-text-muted text-xs mt-1.5">
              {new Date(item.created_at).toLocaleDateString("en-BD", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </GlassCard>
    </Pressable>
  );
}
