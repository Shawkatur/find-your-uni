import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/application/StatusTimeline";
import { DocumentRow } from "@/components/application/DocumentRow";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { useApplication } from "@/hooks/useApplications";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { COUNTRY_FLAG } from "@/lib/countries";
import { Linking } from "react-native";

const DOC_TYPES = ["passport", "transcript", "ielts_cert", "sop", "lor", "cv"] as const;

export default function ApplicationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: app, isLoading, refetch } = useApplication(id);
  const { upload, uploading } = useDocumentUpload();

  if (isLoading || !app) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const uni = app.programs?.universities;
  const prog = app.programs;
  const consultant = app.consultants;
  const uploadedTypes = new Set(app.documents?.map((d: any) => d.doc_type));

  const openWhatsApp = () => {
    if (consultant?.whatsapp) {
      Linking.openURL(`https://wa.me/${consultant.whatsapp.replace(/\D/g, "")}`);
    }
  };

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-text-muted text-xl">‹ Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              {uni?.country && <Text>{COUNTRY_FLAG[uni.country] ?? "🌍"}</Text>}
              <Text className="text-text-base text-xl font-black flex-1" numberOfLines={1}>
                {uni?.name ?? "Application"}
              </Text>
            </View>
            {prog && (
              <Text className="text-text-muted text-sm mt-0.5">
                {prog.name} · {prog.degree_level?.toUpperCase()}
              </Text>
            )}
          </View>
          <StatusBadge status={app.status} />
        </View>

        {/* Timeline */}
        <GlassCard className="mb-4">
          <Text className="text-text-muted text-xs font-semibold mb-3">PROGRESS</Text>
          <StatusTimeline
            currentStatus={app.status}
            history={app.status_history ?? []}
          />
        </GlassCard>

        {/* Documents */}
        <GlassCard className="mb-4">
          <Text className="text-text-muted text-xs font-semibold mb-2">DOCUMENTS</Text>
          {DOC_TYPES.map((docType) => (
            <DocumentRow
              key={docType}
              docType={docType}
              uploaded={uploadedTypes.has(docType)}
              onUpload={() => upload(docType, "files", id)}
            />
          ))}
        </GlassCard>

        {/* Consultant card */}
        {consultant && (
          <GlassCard className="mb-4">
            <Text className="text-text-muted text-xs font-semibold mb-2">YOUR CONSULTANT</Text>
            <Text className="text-text-base font-bold">{consultant.full_name}</Text>
            {consultant.agencies?.name && (
              <Text className="text-text-muted text-sm">{consultant.agencies.name}</Text>
            )}
            {consultant.whatsapp && (
              <TouchableOpacity
                onPress={openWhatsApp}
                className="mt-2 bg-accent/20 py-2 rounded-lg items-center"
              >
                <Text className="text-accent font-semibold text-sm">💬 WhatsApp</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
