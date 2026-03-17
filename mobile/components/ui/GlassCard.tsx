import { View, ViewProps } from "react-native";

interface Props extends ViewProps {
  children: React.ReactNode;
}

export function GlassCard({ children, className = "", style, ...props }: Props) {
  return (
    <View
      className={`bg-surface rounded-2xl border border-white/10 p-4 ${className}`}
      style={[{ shadowColor: "#4F46E5", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 4 }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
