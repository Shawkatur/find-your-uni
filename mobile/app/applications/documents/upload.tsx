import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";

const DOC_TYPES = [
  { value: "passport",    label: "Passport",         emoji: "🛂" },
  { value: "transcript",  label: "Transcript",        emoji: "📄" },
  { value: "ielts_cert",  label: "IELTS Certificate", emoji: "📝" },
  { value: "sop",         label: "Statement of Purpose", emoji: "✍️" },
  { value: "lor",         label: "Letter of Recommendation", emoji: "📨" },
  { value: "cv",          label: "CV / Resume",       emoji: "📋" },
  { value: "nid",         label: "National ID",       emoji: "🪪" },
  { value: "other",       label: "Other",             emoji: "📎" },
];

export default function DocumentUpload() {
  const router = useRouter();
  const { application_id, doc_type: defaultDocType } = useLocalSearchParams<{
    application_id?: string;
    doc_type?: string;
  }>();
  const { upload, uploading } = useDocumentUpload();

  const handleUpload = async (docType: string, source: "camera" | "files") => {
    const result = await upload(docType, source, application_id);
    if (result) {
      Alert.alert("Uploaded", "Document uploaded successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View className="px-5 py-6 gap-5">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-text-muted text-xl">✕</Text>
          </TouchableOpacity>
          <Text className="text-text-base text-xl font-black">Upload Document</Text>
        </View>

        {DOC_TYPES.map((dt) => (
          <GlassCard key={dt.value}>
            <View className="flex-row items-center gap-3 mb-3">
              <Text className="text-2xl">{dt.emoji}</Text>
              <Text className="text-text-base font-bold flex-1">{dt.label}</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleUpload(dt.value, "camera")}
                disabled={uploading}
                className="flex-1 bg-primary/20 py-2 rounded-lg items-center"
              >
                <Text className="text-primary text-sm font-semibold">📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUpload(dt.value, "files")}
                disabled={uploading}
                className="flex-1 bg-surface-2 py-2 rounded-lg items-center border border-white/10"
              >
                <Text className="text-text-base text-sm font-semibold">📁 Files</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </View>
    </ScreenWrapper>
  );
}
