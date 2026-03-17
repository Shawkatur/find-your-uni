import { Text, View } from "react-native";

interface Props {
  score: number; // 0–1
  size?: "sm" | "md" | "lg";
}

function getColor(score: number): string {
  if (score >= 0.75) return "bg-accent";
  if (score >= 0.5) return "bg-amber";
  return "bg-danger";
}

export function ScoreBadge({ score, size = "md" }: Props) {
  const pct = Math.round(score * 100);
  const sizeClass = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const textClass = size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm";

  return (
    <View className={`${sizeClass} rounded-full ${getColor(score)} items-center justify-center`}>
      <Text className={`${textClass} text-white font-bold`}>{pct}</Text>
    </View>
  );
}
