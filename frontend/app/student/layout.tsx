"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  useEffect(() => {
    if (!loading && role !== "student") {
      router.replace("/auth/login?error=forbidden");
    }
  }, [loading, role, router]);

  if (loading) return <FullPageLoader />;
  if (role !== "student") return null;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#F8F9FA] flex">
        <Sidebar role="student" />
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <MobileBottomNav role="student" />
      </div>
    </QueryClientProvider>
  );
}
