import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

interface FormData {
  phone: string;
}

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { phone: "+880" },
  });

  const onSubmit = async ({ phone }: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.startsWith("+") ? phone : `+880${phone}`,
      });
      if (error) throw error;
      router.push({ pathname: "/auth/verify", params: { phone } });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View className="flex-1 px-6 py-12 gap-8">
        <View>
          <Text className="text-text-base text-3xl font-black">Sign In</Text>
          <Text className="text-text-muted text-sm mt-1">
            We'll send a 6-digit code to your phone.
          </Text>
        </View>

        <Controller
          control={control}
          name="phone"
          rules={{ required: "Phone number required" }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone Number"
              placeholder="+8801XXXXXXXXX"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
          )}
        />

        <Button title="Send OTP" onPress={handleSubmit(onSubmit)} loading={loading} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
