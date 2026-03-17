import { Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Button } from "@/components/ui/Button";

export default function Welcome() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-between px-6 py-12">
        {/* Logo / hero */}
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center">
            <Text className="text-white text-4xl font-black">FYU</Text>
          </View>

          <View className="items-center gap-2">
            <Text className="text-text-base text-3xl font-black text-center leading-tight">
              Find Your{"\n"}University
            </Text>
            <Text className="text-text-muted text-base text-center leading-6 max-w-xs">
              AI-powered university matching for Bangladeshi students. Get matched to your best-fit programs in seconds.
            </Text>
          </View>

          {/* Feature pills */}
          <View className="flex-row flex-wrap gap-2 justify-center">
            {["🎯 AI Matchmaking", "🇩🇪 €0 Tuition", "📋 Track Applications", "💰 Scholarships"].map((f) => (
              <View key={f} className="bg-surface px-3 py-1.5 rounded-full border border-white/10">
                <Text className="text-text-muted text-xs">{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTAs */}
        <View className="w-full gap-3">
          <Button title="Get Started" onPress={() => router.push("/auth/register")} />
          <Button
            title="Already have an account? Sign In"
            variant="ghost"
            onPress={() => router.push("/auth/login")}
          />
          <TouchableOpacity
            onPress={() => router.push("/onboarding/intake-code")}
            className="items-center py-2"
          >
            <Text className="text-text-muted text-sm">Have a referral code?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
