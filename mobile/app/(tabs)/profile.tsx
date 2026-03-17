import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Student } from "@/types";

export default function ProfileTab() {
  const router = useRouter();
  const { signOut } = useAuth();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  });

  const student: Student | undefined = me?.profile;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        {/* Profile header */}
        <View className="items-center gap-3 pt-4 pb-2">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-3xl font-black">
              {student?.full_name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text className="text-text-base text-xl font-black">
            {student?.full_name ?? "—"}
          </Text>
          <Text className="text-text-muted text-sm">{student?.phone ?? ""}</Text>
        </View>

        {/* Academic summary */}
        <GlassCard>
          <Text className="text-text-base font-bold mb-3">Academic Profile</Text>
          <View className="gap-2">
            {student?.academic_history?.ssc_gpa != null && (
              <Row label="SSC GPA" value={`${student.academic_history.ssc_gpa} / 5.00`} />
            )}
            {student?.academic_history?.hsc_gpa != null && (
              <Row label="HSC GPA" value={`${student.academic_history.hsc_gpa} / 5.00`} />
            )}
            {student?.academic_history?.bachelor_cgpa != null && (
              <Row label="Bachelor CGPA" value={`${student.academic_history.bachelor_cgpa} / 4.00`} />
            )}
            {student?.test_scores?.ielts != null && (
              <Row label="IELTS" value={String(student.test_scores.ielts)} />
            )}
            {student?.test_scores?.toefl != null && (
              <Row label="TOEFL" value={String(student.test_scores.toefl)} />
            )}
            <Row label="Target Degree" value={student?.preferred_degree?.toUpperCase() ?? "—"} />
            <Row label="Budget" value={`$${(student?.budget_usd_per_year ?? 0).toLocaleString()}/yr`} />
          </View>
        </GlassCard>

        {/* Preferences */}
        <GlassCard>
          <Text className="text-text-base font-bold mb-3">Preferences</Text>
          <Text className="text-text-muted text-sm mb-1">Countries</Text>
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {(student?.preferred_countries ?? []).map((c) => (
              <View key={c} className="bg-primary/20 px-2.5 py-1 rounded-full">
                <Text className="text-primary text-xs font-semibold">{c}</Text>
              </View>
            ))}
          </View>
          <Text className="text-text-muted text-sm mb-1">Fields</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {(student?.preferred_fields ?? []).map((f) => (
              <View key={f} className="bg-surface-2 px-2.5 py-1 rounded-full border border-white/10">
                <Text className="text-text-muted text-xs">{f}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Quick links */}
        <GlassCard>
          <Text className="text-text-base font-bold mb-3">More</Text>
          <TouchableOpacity
            onPress={() => router.push("/scholarships")}
            className="flex-row items-center justify-between py-2.5 border-b border-white/5"
          >
            <Text className="text-text-base text-sm">🎓 Scholarships</Text>
            <Text className="text-text-muted">›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="flex-row items-center justify-between py-2.5 border-b border-white/5"
          >
            <Text className="text-text-base text-sm">🔔 Notifications</Text>
            <Text className="text-text-muted">›</Text>
          </TouchableOpacity>
        </GlassCard>

        <Button title="Sign Out" variant="danger" onPress={handleSignOut} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-text-muted text-sm">{label}</Text>
      <Text className="text-text-base text-sm font-semibold">{value}</Text>
    </View>
  );
}
