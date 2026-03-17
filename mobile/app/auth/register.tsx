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
  email?: string;
}

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { phone: "+880" },
  });

  const onSubmit = async ({ phone, email }: FormData) => {
    setLoading(true);
    try {
      const normalizedPhone = phone.startsWith("+") ? phone : `+880${phone}`;
      const opts: any = { phone: normalizedPhone };
      if (email?.trim()) opts.email = email.trim();

      const { error } = await supabase.auth.signInWithOtp(opts);
      if (error) throw error;
      router.push({ pathname: "/auth/verify", params: { phone: normalizedPhone } });
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
          <Text className="text-text-base text-3xl font-black">Create Account</Text>
          <Text className="text-text-muted text-sm mt-1">
            Phone OTP is the only sign-in method — no passwords needed.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="phone"
            rules={{ required: "Phone number required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone Number (BD)"
                placeholder="+8801XXXXXXXXX"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email (optional)"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
        </View>

        <View className="gap-3">
          <Button title="Send OTP" onPress={handleSubmit(onSubmit)} loading={loading} />
          <Button
            title="Already registered? Sign In"
            variant="ghost"
            onPress={() => router.push("/auth/login")}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
