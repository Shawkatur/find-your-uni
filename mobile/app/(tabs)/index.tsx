import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { MatchCard } from "@/components/match/MatchCard";
import api from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  });

  const { data: matchResults } = useQuery({
    queryKey: ["match", "results"],
    queryFn: () => api.get("/match/results").then((r) => r.data ?? []),
  });

  const { data: applications } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get("/applications").then((r) => r.data ?? []),
  });

  const { data: deadlines } = useQuery({
    queryKey: ["deadlines"],
    queryFn: () => api.get("/deadlines").then((r) => r.data ?? []),
  });

  const name = me?.profile?.full_name?.split(" ")[0] ?? "there";
  const topMatch = matchResults?.[0];

  return (
    <ScreenWrapper scroll>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-text-muted text-sm">Welcome back,</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-text-base text-2xl font-black">{name} 👋</Text>
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Text className="text-xl">🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 gap-6">
          {/* Stats row */}
          <View className="flex-row gap-3">
            <GlassCard className="flex-1">
              <Text className="text-text-muted text-xs">Match Results</Text>
              <Text className="text-text-base text-2xl font-black mt-1">
                {matchResults?.length ?? 0}
              </Text>
            </GlassCard>
            <GlassCard className="flex-1">
              <Text className="text-text-muted text-xs">Applications</Text>
              <Text className="text-text-base text-2xl font-black mt-1">
                {applications?.length ?? 0}
              </Text>
            </GlassCard>
          </View>

          {/* Top match */}
          {topMatch && (
            <View>
              <SectionHeader
                title="Top Match"
                action={
                  <TouchableOpacity onPress={() => router.push("/match/results")}>
                    <Text className="text-primary text-sm">See all</Text>
                  </TouchableOpacity>
                }
              />
              <MatchCard item={topMatch} index={0} />
            </View>
          )}

          {/* No match yet */}
          {!topMatch && (
            <GlassCard>
              <Text className="text-text-base font-bold text-base mb-1">Run Your Match</Text>
              <Text className="text-text-muted text-sm mb-3">
                Get AI-powered university recommendations tailored to your profile.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/match/run")}
                className="bg-primary rounded-xl py-2.5 items-center"
              >
                <Text className="text-white font-semibold">Find My Universities</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* Upcoming deadlines */}
          {deadlines && deadlines.length > 0 && (
            <View>
              <SectionHeader title="Upcoming Deadlines" />
              {deadlines.slice(0, 3).map((d: any) => (
                <GlassCard key={d.id} className="mb-2">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-text-base text-sm font-semibold" numberOfLines={1}>
                        {d.universities?.name ?? "University"}
                      </Text>
                      <Text className="text-text-muted text-xs mt-0.5" numberOfLines={1}>
                        {d.name}
                      </Text>
                    </View>
                    <View className="bg-amber/20 px-2 py-1 rounded-lg ml-2">
                      <Text className="text-amber text-xs font-semibold">
                        {new Date(d.application_deadline).toLocaleDateString("en-BD", {
                          day: "numeric", month: "short",
                        })}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
