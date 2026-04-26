import axios from "axios";
import { createClient } from "@/lib/supabase";

const adminApi = axios.create({
  // Route through server-side proxy so the admin secret stays on the server
  baseURL: "/api/admin-proxy",
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use(async (config) => {
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

export default adminApi;
