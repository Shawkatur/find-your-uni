import { ActivityIndicator, Pressable, Text } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props {
  onPress: () => void;
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variants: Record<Variant, string> = {
  primary:   "bg-primary active:opacity-80",
  secondary: "bg-surface-2 border border-white/10 active:opacity-80",
  ghost:     "active:opacity-60",
  danger:    "bg-danger active:opacity-80",
};

const textColors: Record<Variant, string> = {
  primary:   "text-white font-semibold",
  secondary: "text-text-base font-semibold",
  ghost:     "text-primary font-semibold",
  danger:    "text-white font-semibold",
};

export function Button({ onPress, title, variant = "primary", loading, disabled, className = "" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl px-4 py-3 items-center justify-center flex-row gap-2 ${variants[variant]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
    >
      {loading && <ActivityIndicator size="small" color="white" />}
      <Text className={`text-base ${textColors[variant]}`}>{title}</Text>
    </Pressable>
  );
}
