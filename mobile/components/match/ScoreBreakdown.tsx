import { Text, View } from "react-native";
import { MatchScore } from "@/types";

interface Props {
  score: MatchScore;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-text-muted text-xs">{label}</Text>
        <Text className="text-text-base text-xs font-semibold">{pct}%</Text>
      </View>
      <View className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

export function ScoreBreakdown({ score }: Props) {
  return (
    <View>
      <Bar label="Overall Match"        value={score.total}           color="bg-primary" />
      <Bar label="QS Ranking"           value={score.ranking}         color="bg-purple" />
      <Bar label="Cost Efficiency"      value={score.cost_efficiency} color="bg-accent" />
      <Bar label="BD Acceptance Rate"   value={score.bd_acceptance}   color="bg-amber" />
      <Bar label="Academic Eligibility" value={score.eligibility}     color="bg-primary" />
    </View>
  );
}
