"use client";

import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  if (loading) return <FullPageLoader />;
  if (!user) return null; // middleware handles redirect

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#0F172A] flex">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
