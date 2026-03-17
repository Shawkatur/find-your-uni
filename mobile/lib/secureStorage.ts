import * as SecureStore from "expo-secure-store";

const KEY = "fyu_jwt";

export const secureStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEY, token);
  },

  async deleteToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY);
  },
};
