import { Text, View } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-1">
        <Text className="text-text-base font-bold text-lg">{title}</Text>
        {subtitle && (
          <Text className="text-text-muted text-sm mt-0.5">{subtitle}</Text>
        )}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}
