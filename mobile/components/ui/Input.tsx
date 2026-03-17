import { Text, TextInput, TextInputProps, View } from "react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: Props) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-text-muted text-sm mb-1.5 font-medium">{label}</Text>
      )}
      <TextInput
        placeholderTextColor="#6B7280"
        className={`bg-surface-2 border ${error ? "border-danger" : "border-white/10"} rounded-xl px-4 py-3 text-text-base text-base ${className}`}
        {...props}
      />
      {error && (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
