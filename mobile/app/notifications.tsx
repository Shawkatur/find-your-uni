import { Text, TouchableOpacity, View } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRealtime } from "@/hooks/useRealtime";
import { useAuth } from "@/hooks/useAuth";
import { AppNotification } from "@/types";
import { FlashList } from "@shopify/flash-list";

export default function Notifications() {
  const router = useRouter();
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const handleNotification = useCallback((n: AppNotification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  useRealtime(session?.user?.id, handleNotification);

  return (
    <ScreenWrapper>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pt-6 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-text-muted text-xl">✕</Text>
          </TouchableOpacity>
          <Text className="text-text-base text-xl font-black">Notifications</Text>
        </View>

        {notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-4xl">🔔</Text>
            <Text className="text-text-muted text-center">
              No notifications yet.{"\n"}Status updates will appear here in real time.
            </Text>
          </View>
        ) : (
          <FlashList
            data={notifications}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/applications/${item.application_id}`)}
                className="mx-5 mb-3"
              >
                <GlassCard>
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-text-base font-semibold text-sm">
                        Application Updated
                      </Text>
                      {item.note && (
                        <Text className="text-text-muted text-xs mt-0.5">{item.note}</Text>
                      )}
                      <Text className="text-text-muted text-xs mt-1">
                        {new Date(item.received_at).toLocaleTimeString("en-BD", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <StatusBadge status={item.new_status} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            )}
            estimatedItemSize={90}
            keyExtractor={(item, i) => `${item.application_id}-${i}`}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
