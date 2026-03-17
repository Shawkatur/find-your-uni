import { SafeAreaView, ScrollView, View, ViewProps } from "react-native";

interface Props extends ViewProps {
  scroll?: boolean;
  children: React.ReactNode;
}

export function ScreenWrapper({ scroll = false, children, className, ...props }: Props) {
  const inner = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1" {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {inner}
    </SafeAreaView>
  );
}
