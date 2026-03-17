import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";

interface FormData {
  ssc_gpa: string;
  hsc_gpa: string;
  bachelor_cgpa: string;
  gpa_percentage: string;
}

export default function Step2Academic() {
  const router = useRouter();
  const { setAcademic, degree, ssc_gpa, hsc_gpa, bachelor_cgpa, gpa_percentage } = useSetupStore();
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      ssc_gpa: ssc_gpa ? String(ssc_gpa) : "",
      hsc_gpa: hsc_gpa ? String(hsc_gpa) : "",
      bachelor_cgpa: bachelor_cgpa ? String(bachelor_cgpa) : "",
      gpa_percentage: gpa_percentage ? String(gpa_percentage) : "",
    },
  });

  const onSubmit = (data: FormData) => {
    setAcademic({
      ssc_gpa:      data.ssc_gpa      ? parseFloat(data.ssc_gpa)      : undefined,
      hsc_gpa:      data.hsc_gpa      ? parseFloat(data.hsc_gpa)      : undefined,
      bachelor_cgpa: data.bachelor_cgpa ? parseFloat(data.bachelor_cgpa) : undefined,
      gpa_percentage: data.gpa_percentage ? parseInt(data.gpa_percentage) : undefined,
    });
    router.push("/setup/step-3-tests");
  };

  const showBachelor = degree !== "bachelor";

  return (
    <ScreenWrapper scroll>
      <View className="px-6 py-10 gap-8">
        <View className="flex-row gap-1.5">
          {[1,2,3,4,5,6].map((s) => (
            <View key={s} className={`h-1 flex-1 rounded-full ${s <= 2 ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </View>

        <View>
          <Text className="text-text-muted text-sm font-medium">Step 2 of 6</Text>
          <Text className="text-text-base text-2xl font-black mt-1">Academic Results</Text>
          <Text className="text-text-muted text-sm mt-1">
            BD grading: SSC/HSC GPA out of 5.00
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="ssc_gpa"
            render={({ field: { onChange, value } }) => (
              <Input
                label="SSC GPA (out of 5.00)"
                placeholder="e.g. 4.50"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="hsc_gpa"
            render={({ field: { onChange, value } }) => (
              <Input
                label="HSC GPA (out of 5.00)"
                placeholder="e.g. 4.25"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
              />
            )}
          />

          {showBachelor && (
            <>
              <Controller
                control={control}
                name="bachelor_cgpa"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Bachelor CGPA (out of 4.00)"
                    placeholder="e.g. 3.50"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                  />
                )}
              />

              <Controller
                control={control}
                name="gpa_percentage"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Overall % (if known)"
                    placeholder="e.g. 75"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                  />
                )}
              />
            </>
          )}
        </View>

        <Button title="Continue" onPress={handleSubmit(onSubmit)} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
