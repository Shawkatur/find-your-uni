import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  docType: string;
  fileName?: string;
  uploaded: boolean;
  onUpload: () => void;
}

const DOC_LABELS: Record<string, string> = {
  passport:    "Passport",
  transcript:  "Transcript / Marksheet",
  ielts_cert:  "IELTS Certificate",
  toefl_cert:  "TOEFL Certificate",
  sop:         "Statement of Purpose",
  lor:         "Letter of Recommendation",
  cv:          "CV / Resume",
  nid:         "National ID (NID)",
  other:       "Other Document",
};

export function DocumentRow({ docType, fileName, uploaded, onUpload }: Props) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-white/5">
      <View className="flex-1">
        <Text className="text-text-base text-sm font-medium">
          {DOC_LABELS[docType] ?? docType}
        </Text>
        {uploaded && fileName && (
          <Text className="text-accent text-xs mt-0.5" numberOfLines={1}>
            ✓ {fileName}
          </Text>
        )}
        {!uploaded && (
          <Text className="text-text-muted text-xs mt-0.5">Not uploaded</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={onUpload}
        className={`px-3 py-1.5 rounded-lg ${uploaded ? "bg-accent/20" : "bg-primary/20"}`}
      >
        <Text className={`text-xs font-semibold ${uploaded ? "text-accent" : "text-primary"}`}>
          {uploaded ? "Replace" : "Upload"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
