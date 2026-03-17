import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";

interface FormData {
  ielts: string;
  toefl: string;
  gre: string;
}

export default function Step3Tests() {
  const router = useRouter();
  const { setTests, ielts, toefl, gre } = useSetupStore();
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      ielts: ielts ? String(ielts) : "",
      toefl: toefl ? String(toefl) : "",
      gre:   gre   ? String(gre)   : "",
    },
  });

  const onSubmit = (data: FormData) => {
    setTests({
      ielts: data.ielts ? parseFloat(data.ielts) : undefined,
      toefl: data.toefl ? parseInt(data.toefl)   : undefined,
      gre:   data.gre   ? parseInt(data.gre)     : undefined,
    });
    router.push("/setup/step-4-preferences");
  };

  return (
    <ScreenWrapper scroll>
      <View className="px-6 py-10 gap-8">
        <View className="flex-row gap-1.5">
          {[1,2,3,4,5,6].map((s) => (
            <View key={s} className={`h-1 flex-1 rounded-full ${s <= 3 ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </View>

        <View>
          <Text className="text-text-muted text-sm font-medium">Step 3 of 6</Text>
          <Text className="text-text-base text-2xl font-black mt-1">Language & Test Scores</Text>
          <Text className="text-text-muted text-sm mt-1">
            All fields are optional. Helps narrow down eligible programs.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="ielts"
            render={({ field: { onChange, value } }) => (
              <Input
                label="IELTS Score (0–9)"
                placeholder="e.g. 6.5"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="toefl"
            render={({ field: { onChange, value } }) => (
              <Input
                label="TOEFL Score (0–120)"
                placeholder="e.g. 90"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="gre"
            render={({ field: { onChange, value } }) => (
              <Input
                label="GRE Score (260–340)"
                placeholder="e.g. 310"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
              />
            )}
          />
        </View>

        <Button title="Continue" onPress={handleSubmit(onSubmit)} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
