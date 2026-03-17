import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";
import api from "@/lib/api";

interface FormData {
  full_name: string;
  phone: string;
}

export default function Step6Complete() {
  const router = useRouter();
  const store = useSetupStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      full_name: store.full_name ?? "",
      phone: store.phone ?? "+880",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Register student profile
      await api.post("/auth/student/register", {
        full_name:           data.full_name,
        phone:               data.phone,
        academic_history: {
          ssc_gpa:         store.ssc_gpa,
          hsc_gpa:         store.hsc_gpa,
          bachelor_cgpa:   store.bachelor_cgpa,
          gpa_percentage:  store.gpa_percentage,
        },
        test_scores: {
          ielts: store.ielts,
          toefl: store.toefl,
          gre:   store.gre,
        },
        budget_usd_per_year: store.budget_usd_per_year,
        preferred_countries: store.countries,
        preferred_degree:    store.degree,
        preferred_fields:    store.fields,
        ref_code:            store.ref_code,
      });

      // Mark onboarding complete
      await api.patch("/auth/student/profile", { onboarding_completed: true } as any);

      // Run first match
      await api.post("/match");

      store.reset();
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Profile already exists — just go to tabs
        router.replace("/(tabs)");
        return;
      }
      Alert.alert("Error", err?.response?.data?.detail ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View className="px-6 py-10 gap-8">
        <View className="flex-row gap-1.5">
          {[1,2,3,4,5,6].map((s) => (
            <View key={s} className="h-1 flex-1 rounded-full bg-primary" />
          ))}
        </View>

        <View>
          <Text className="text-text-muted text-sm font-medium">Step 6 of 6</Text>
          <Text className="text-text-base text-2xl font-black mt-1">Almost There!</Text>
          <Text className="text-text-muted text-sm mt-1">
            Enter your name to complete your profile. We'll run your first match automatically.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="full_name"
            rules={{ required: "Name required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={value}
                onChangeText={onChange}
                error={errors.full_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone (optional)"
                placeholder="+8801XXXXXXXXX"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
              />
            )}
          />
        </View>

        <View className="bg-primary/10 border border-primary/20 rounded-xl p-3">
          <Text className="text-primary text-sm font-semibold">
            ✨ Your AI match is ready to run
          </Text>
          <Text className="text-text-muted text-xs mt-1">
            Based on your academic profile, budget, and country preferences — results appear instantly.
          </Text>
        </View>

        <Button
          title="Complete Setup & Run Match"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
