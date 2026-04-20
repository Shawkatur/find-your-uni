import axios from "axios";
import { createClient } from "@/lib/supabase";

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // no session
  }

  const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET;
  if (secret) {
    config.headers["X-Admin-Secret"] = secret;
  }

  return config;
});

export default adminApi;
