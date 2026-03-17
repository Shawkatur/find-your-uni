import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";

export default function IntakeCode() {
  const router = useRouter();
  const setRefCode = useSetupStore((s) => s.setRefCode);
  const { control, handleSubmit } = useForm<{ code: string }>();

  const onSubmit = ({ code }: { code: string }) => {
    if (code.trim()) setRefCode(code.trim());
    router.push("/auth/register");
  };

  return (
    <ScreenWrapper scroll>
      <View className="flex-1 px-6 py-12 gap-6">
        <View>
          <Text className="text-text-base text-2xl font-black">Referral Code</Text>
          <Text className="text-text-muted text-sm mt-1">
            Enter the code your consultant gave you. This links your account to their agency.
          </Text>
        </View>

        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Consultant Code"
              placeholder="e.g. ABC123"
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
            />
          )}
        />

        <Button title="Continue" onPress={handleSubmit(onSubmit)} />
        <Button title="Skip" variant="ghost" onPress={() => router.push("/auth/register")} />
      </View>
    </ScreenWrapper>
  );
}
