import axios from "axios";
import { createClient } from "@/lib/supabase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT + admin secret header where applicable
api.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // no session — request goes through without auth header
  }

  // Attach admin secret for /admin/* routes
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
  if (adminSecret && config.url?.startsWith("/admin")) {
    config.headers["X-Admin-Secret"] = adminSecret;
  }

  return config;
});

export default api;
