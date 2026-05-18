"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Header } from "@/components/layout/Header";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "super_admin") {
      router.replace("/auth/login?error=unauthorized");
    }
  }, [loading, role, router]);

  if (loading) return <FullPageLoader />;
  if (role !== "super_admin") return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
