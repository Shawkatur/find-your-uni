import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[push] Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Push notification permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F46E5",
    });
  }

  return tokenData.data;
}

export async function registerTokenWithBackend(token: string): Promise<void> {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  try {
    await api.post("/push/register", { token, platform });
  } catch (err) {
    console.error("[push] Failed to register token:", err);
  }
}

export async function unregisterTokenFromBackend(token: string): Promise<void> {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  try {
    await api.delete("/push/register", { data: { token, platform } });
  } catch {
    // silent
  }
}
