"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Header } from "@/components/layout/Header";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  useEffect(() => {
    if (!loading && role !== "super_admin") {
      router.replace("/auth/login?error=unauthorized");
    }
  }, [loading, role, router]);

  if (loading) return <FullPageLoader />;
  if (role !== "super_admin") return null;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#FAFAFA] flex">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
