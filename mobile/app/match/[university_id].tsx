import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ScoreBreakdown } from "@/components/match/ScoreBreakdown";
import { AISummaryBubble } from "@/components/match/AISummaryBubble";
import { Button } from "@/components/ui/Button";
import { COUNTRY_FLAG, COUNTRY_NAME } from "@/lib/countries";
import api from "@/lib/api";
import { MatchResultItem } from "@/types";

export default function UniversityDetail() {
  const router = useRouter();
  const { university_id, program_id } = useLocalSearchParams<{
    university_id: string;
    program_id?: string;
  }>();

  const { data: results } = useQuery<MatchResultItem[]>({
    queryKey: ["match", "results"],
    queryFn: () => api.get("/match/results").then((r) => r.data ?? []),
  });

  const { data: uni } = useQuery({
    queryKey: ["university", university_id],
    queryFn: () => api.get(`/universities/${university_id}`).then((r) => r.data),
    enabled: !!university_id,
  });

  const matchItem = results?.find((r) => r.university.id === university_id);
  const program = matchItem?.program ?? uni?.programs?.find((p: any) => p.id === program_id);
  const university = matchItem?.university ?? uni;

  if (!university) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const flag = COUNTRY_FLAG[university.country] ?? "🌍";

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-text-muted text-xl">‹ Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-14 h-14 rounded-2xl bg-surface-2 items-center justify-center border border-white/10">
            <Text className="text-2xl">{flag}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-base text-xl font-black leading-tight">
              {university.name}
            </Text>
            <Text className="text-text-muted text-sm mt-0.5">
              {university.city ? `${university.city}, ` : ""}
              {COUNTRY_NAME[university.country] ?? university.country}
            </Text>
          </View>
          {matchItem && <ScoreBadge score={matchItem.score.total} size="lg" />}
        </View>

        {/* Key stats */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {university.ranking_qs && (
            <Pill label={`QS #${university.ranking_qs}`} color="bg-purple/20 text-purple" />
          )}
          {university.tuition_usd_per_year === 0 ? (
            <Pill label="€0 Tuition" color="bg-accent/20 text-accent" />
          ) : (
            <Pill label={`$${university.tuition_usd_per_year?.toLocaleString()}/yr`} color="bg-amber/20 text-amber" />
          )}
          {university.scholarships_available && (
            <Pill label="Scholarships Available" color="bg-primary/20 text-primary" />
          )}
          {university.acceptance_rate_bd && (
            <Pill label={`${university.acceptance_rate_bd}% BD Accept`} color="bg-accent/20 text-accent" />
          )}
        </View>

        {/* Program */}
        {program && (
          <GlassCard className="mb-4">
            <Text className="text-text-muted text-xs font-semibold mb-2">MATCHED PROGRAM</Text>
            <Text className="text-text-base font-bold text-base">{program.name}</Text>
            <Text className="text-text-muted text-sm mt-0.5">
              {program.degree_level?.toUpperCase()} · {program.field}
              {program.duration_years ? ` · ${program.duration_years} years` : ""}
            </Text>
            {program.application_deadline && (
              <View className="mt-2 bg-amber/10 rounded-lg p-2 flex-row items-center gap-2">
                <Text className="text-amber text-xs">
                  ⏰ Deadline: {new Date(program.application_deadline).toLocaleDateString("en-BD", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Score breakdown */}
        {matchItem && (
          <GlassCard className="mb-4">
            <Text className="text-text-muted text-xs font-semibold mb-3">MATCH SCORE BREAKDOWN</Text>
            <ScoreBreakdown score={matchItem.score} />
          </GlassCard>
        )}

        {/* AI Summary */}
        {matchItem?.ai_summary && <AISummaryBubble summary={matchItem.ai_summary} />}

        {/* Description */}
        {university.description && (
          <GlassCard className="mt-4">
            <Text className="text-text-base text-sm leading-5">{university.description}</Text>
          </GlassCard>
        )}

        {/* Apply CTA */}
        <View className="mt-6">
          <Button
            title="Start Application"
            onPress={() => router.push({
              pathname: "/applications/new",
              params: { program_id: program?.id, university_id: university.id },
            })}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  const [bg, text] = color.split(" ");
  return (
    <View className={`px-2.5 py-1 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
