import axios from "axios";
import { supabase } from "./supabase";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT from active session
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // no session — request goes through without auth header
  }
  return config;
});

// On 401, try refreshing the session once and retry the request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;
      try {
        const { data } = await supabase.auth.refreshSession();
        if (data.session?.access_token) {
          original.headers.Authorization = `Bearer ${data.session.access_token}`;
          return api(original);
        }
      } catch {
        // refresh failed — propagate original 401
      }
    }
    return Promise.reject(error);
  },
);

export default api;
