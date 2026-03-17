import { Text, View } from "react-native";

interface Props {
  summary: string;
}

export function AISummaryBubble({ summary }: Props) {
  if (!summary) return null;
  return (
    <View className="bg-primary/10 border border-primary/20 rounded-xl p-3 mt-3">
      <Text className="text-primary text-xs font-semibold mb-1">✨ AI Match Summary</Text>
      <Text className="text-text-base text-sm leading-5">{summary}</Text>
    </View>
  );
}
