import { Dimensions, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Button } from "@/components/ui/Button";

const { width } = Dimensions.get("window");

const STEPS = [
  {
    emoji: "🎓",
    title: "Tell Us About You",
    description: "Enter your SSC/HSC/Bachelor results, IELTS score, and target degree. Takes 2 minutes.",
  },
  {
    emoji: "🤖",
    title: "AI Finds Your Matches",
    description: "Our engine scores 1000s of programs by ranking, cost, and Bangladesh acceptance rate.",
  },
  {
    emoji: "🚀",
    title: "Apply & Track",
    description: "Start applications, upload documents, and track every status update in real time.",
  },
];

export default function HowItWorks() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const listRef = useRef<FlatList>(null);

  const next = () => {
    if (current < STEPS.length - 1) {
      listRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      router.push("/auth/register");
    }
  };

  return (
    <ScreenWrapper>
      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={STEPS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={{ width }} className="items-center justify-center px-8 gap-6">
              <Text className="text-7xl">{item.emoji}</Text>
              <Text className="text-text-base text-2xl font-black text-center">{item.title}</Text>
              <Text className="text-text-muted text-base text-center leading-6">{item.description}</Text>
            </View>
          )}
          keyExtractor={(_, i) => String(i)}
        />

        {/* Dots */}
        <View className="flex-row justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${i === current ? "w-6 bg-primary" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </View>

        <View className="px-6 pb-10">
          <Button
            title={current < STEPS.length - 1 ? "Next" : "Get Started"}
            onPress={next}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
