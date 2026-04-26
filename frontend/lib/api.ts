import axios from "axios";
import { createClient } from "@/lib/supabase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT (getUser() validates the token server-side first)
api.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    }
  } catch {
    // no session — request goes through without auth header
  }

  return config;
});

export default api;
