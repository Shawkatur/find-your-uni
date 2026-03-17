import { Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";

const MIN = 3000;
const MAX = 80000;
const MARKS = [
  { value: 3000,  label: "$3k",  note: "E. Europe / Malaysia" },
  { value: 10000, label: "$10k", note: "Most EU countries" },
  { value: 20000, label: "$20k", note: "Australia / Canada" },
  { value: 40000, label: "$40k", note: "UK top unis" },
  { value: 80000, label: "$80k", note: "US Ivy League" },
];

export default function Step5Budget() {
  const router = useRouter();
  const { setBudget, budget_usd_per_year } = useSetupStore();
  const [budget, setBudgetLocal] = useState(budget_usd_per_year);

  // Find nearest note
  const nearest = MARKS.reduce((a, b) =>
    Math.abs(b.value - budget) < Math.abs(a.value - budget) ? b : a
  );

  const onSubmit = () => {
    setBudget(budget);
    router.push("/setup/step-6-complete");
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 py-10 gap-8">
        <View className="flex-row gap-1.5">
          {[1,2,3,4,5,6].map((s) => (
            <View key={s} className={`h-1 flex-1 rounded-full ${s <= 5 ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </View>

        <View>
          <Text className="text-text-muted text-sm font-medium">Step 5 of 6</Text>
          <Text className="text-text-base text-2xl font-black mt-1">Annual Budget</Text>
          <Text className="text-text-muted text-sm mt-1">
            Tuition fees per year (USD). Living costs are additional.
          </Text>
        </View>

        {/* Display */}
        <View className="items-center gap-2">
          <Text className="text-primary text-4xl font-black">
            ${budget.toLocaleString()}
          </Text>
          <Text className="text-text-muted text-sm">{nearest.note}</Text>
        </View>

        {/* Quick preset buttons */}
        <View className="flex-row flex-wrap gap-2 justify-center">
          {MARKS.map((m) => (
            <Button
              key={m.value}
              title={m.label}
              variant={budget === m.value ? "primary" : "secondary"}
              onPress={() => setBudgetLocal(m.value)}
              className="px-4 py-2 flex-none"
            />
          ))}
        </View>

        {/* Germany highlight */}
        <View className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex-row items-center gap-2">
          <Text className="text-2xl">🇩🇪</Text>
          <View className="flex-1">
            <Text className="text-accent font-bold text-sm">Germany — €0 Tuition</Text>
            <Text className="text-text-muted text-xs">
              Most German public universities charge no tuition. Set budget as low as $3k for living costs.
            </Text>
          </View>
        </View>

        <Button title="Continue" onPress={onSubmit} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
