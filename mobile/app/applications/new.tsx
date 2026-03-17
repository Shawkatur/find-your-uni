import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useCreateApplication } from "@/hooks/useApplications";
import api from "@/lib/api";

export default function NewApplication() {
  const router = useRouter();
  const { program_id, university_id } = useLocalSearchParams<{
    program_id?: string;
    university_id?: string;
  }>();

  const createApp = useCreateApplication();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  });

  const { data: uni } = useQuery({
    queryKey: ["university", university_id],
    queryFn: () => api.get(`/universities/${university_id}`).then((r) => r.data),
    enabled: !!university_id,
  });

  const program = uni?.programs?.find((p: any) => p.id === program_id);

  const onApply = () => {
    if (!me?.profile?.id) {
      Alert.alert("Error", "Please complete your profile first");
      return;
    }

    createApp.mutate(
      {
        student_id: me.profile.id,
        program_id: program_id ?? undefined,
      },
      {
        onSuccess: (app: any) => {
          Alert.alert("Application Started", "Your application has been created!", [
            { text: "View", onPress: () => router.replace(`/applications/${app.id}`) },
          ]);
        },
        onError: (err: any) => {
          Alert.alert("Error", err?.response?.data?.detail ?? "Failed to create application");
        },
      }
    );
  };

  return (
    <ScreenWrapper scroll>
      <View className="px-5 py-6 gap-6">
        <View className="flex-row items-center gap-3">
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} className="flex-none" />
          <Text className="text-text-base text-xl font-black flex-1">New Application</Text>
        </View>

        {uni && (
          <GlassCard>
            <Text className="text-text-muted text-xs font-semibold mb-2">UNIVERSITY</Text>
            <Text className="text-text-base font-bold text-base">{uni.name}</Text>
            {program && (
              <Text className="text-text-muted text-sm mt-0.5">
                {program.name} · {program.degree_level?.toUpperCase()}
              </Text>
            )}
          </GlassCard>
        )}

        <GlassCard>
          <Text className="text-text-muted text-sm leading-5">
            This will create a new application entry. Your consultant (if assigned) will be able to see it and guide you through the next steps.
          </Text>
        </GlassCard>

        <Button
          title="Start Application"
          onPress={onApply}
          loading={createApp.isPending}
        />
      </View>
    </ScreenWrapper>
  );
}
