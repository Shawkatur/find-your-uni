import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { useSetupStore } from "@/lib/setupStore";
import { TARGET_COUNTRIES } from "@/lib/countries";

const FIELDS = [
  "Computer Science", "Engineering", "Business", "Medicine",
  "Law", "Architecture", "Arts & Humanities", "Social Sciences",
  "Natural Sciences", "Agriculture", "Pharmacy",
];

export default function Step4Preferences() {
  const router = useRouter();
  const { setPreferences, countries: savedCountries, fields: savedFields } = useSetupStore();
  const [countries, setCountries] = useState<string[]>(savedCountries);
  const [fields, setFields] = useState<string[]>(savedFields);

  const toggleCountry = (code: string) => {
    setCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleField = (f: string) => {
    setFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const onSubmit = () => {
    setPreferences(countries, fields);
    router.push("/setup/step-5-budget");
  };

  return (
    <ScreenWrapper scroll>
      <View className="px-6 py-10 gap-8">
        <View className="flex-row gap-1.5">
          {[1,2,3,4,5,6].map((s) => (
            <View key={s} className={`h-1 flex-1 rounded-full ${s <= 4 ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </View>

        <View>
          <Text className="text-text-muted text-sm font-medium">Step 4 of 6</Text>
          <Text className="text-text-base text-2xl font-black mt-1">Where & What?</Text>
        </View>

        {/* Countries */}
        <View>
          <Text className="text-text-base font-semibold mb-3">Target Countries</Text>
          <View className="flex-row flex-wrap gap-2">
            {TARGET_COUNTRIES.map((c) => {
              const sel = countries.includes(c.code);
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => toggleCountry(c.code)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
                    sel ? "bg-primary border-primary" : "bg-surface border-white/10"
                  }`}
                >
                  <Text>{c.flag}</Text>
                  <Text className={`text-sm font-medium ${sel ? "text-white" : "text-text-muted"}`}>
                    {c.name}
                  </Text>
                  {c.note && (
                    <Text className={`text-xs ${sel ? "text-white/80" : "text-accent"}`}>
                      ({c.note})
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fields */}
        <View>
          <Text className="text-text-base font-semibold mb-3">Fields of Study</Text>
          <View className="flex-row flex-wrap gap-2">
            {FIELDS.map((f) => {
              const sel = fields.includes(f);
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => toggleField(f)}
                  className={`px-3 py-2 rounded-full border ${
                    sel ? "bg-primary border-primary" : "bg-surface border-white/10"
                  }`}
                >
                  <Text className={`text-sm font-medium ${sel ? "text-white" : "text-text-muted"}`}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Continue"
          disabled={countries.length === 0 && fields.length === 0}
          onPress={onSubmit}
        />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
