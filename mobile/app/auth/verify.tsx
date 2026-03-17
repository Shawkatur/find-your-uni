import { useRef, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

export default function Verify() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (index === 5 && text) {
      verify([...newOtp.slice(0, 5), text].join(""));
    }
  };

  const verify = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone?.startsWith("+") ? phone : `+880${phone}`,
        token: code,
        type: "sms",
      });
      if (error) throw error;
      // Root index will redirect to setup or tabs
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Invalid Code", err.message ?? "Please try again");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 py-12 gap-8">
        <View>
          <Text className="text-text-base text-3xl font-black">Enter Code</Text>
          <Text className="text-text-muted text-sm mt-1">
            Sent to {phone ?? "your phone"}
          </Text>
        </View>

        <View className="flex-row gap-3 justify-center">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { if (el) inputs.current[i] = el; }}
              value={digit}
              onChangeText={(t) => handleChange(t.slice(-1), i)}
              keyboardType="number-pad"
              maxLength={1}
              className="w-12 h-14 bg-surface-2 border border-white/10 rounded-xl text-text-base text-center text-xl font-bold"
            />
          ))}
        </View>

        <Button
          title="Verify"
          onPress={() => verify(otp.join(""))}
          loading={loading}
          disabled={otp.join("").length < 6}
        />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
