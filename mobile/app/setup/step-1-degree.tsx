import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";

const DEGREES = [
  { value: "bachelor", label: "Bachelor's", emoji: "🎓", desc: "Undergraduate degree" },
  { value: "master",   label: "Master's",   emoji: "📚", desc: "Postgraduate degree" },
  { value: "phd",      label: "PhD",        emoji: "🔬", desc: "Doctoral research" },
  { value: "diploma",  label: "Diploma",    emoji: "📜", desc: "Short programmes" },
] as const;

export default function Step1Degree() {
  const router = useRouter();
  const { degree, setDegree } = useSetupStore();

  return (
    <ScreenWrapper scroll>
      <View className="px-6 py-10 gap-8">
        {/* Progress */}
        <View className="flex-row gap-1.5">
          {[1,2,3,4,5,6].map((s) => (
            <View key={s} className={`h-1 flex-1 rounded-full ${s === 1 ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </View>

        <View>
          <Text className="text-text-muted text-sm font-medium">Step 1 of 6</Text>
          <Text className="text-text-base text-2xl font-black mt-1">What degree are you pursuing?</Text>
        </View>

        <View className="gap-3">
          {DEGREES.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => setDegree(d.value)}
              className={`bg-surface rounded-2xl border p-4 flex-row items-center gap-4 ${
                degree === d.value ? "border-primary" : "border-white/10"
              }`}
            >
              <Text className="text-3xl">{d.emoji}</Text>
              <View className="flex-1">
                <Text className="text-text-base font-bold text-base">{d.label}</Text>
                <Text className="text-text-muted text-sm">{d.desc}</Text>
              </View>
              {degree === d.value && (
                <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Continue"
          disabled={!degree}
          onPress={() => router.push("/setup/step-2-academic")}
        />
      </View>
    </ScreenWrapper>
  );
}
