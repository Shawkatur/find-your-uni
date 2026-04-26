"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Clock, ShieldX, LogOut } from "lucide-react";
import api from "@/lib/api";

function PendingApprovalGate({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();

  const { data: consultant, isLoading } = useQuery({
    queryKey: ["consultant-me"],
    queryFn: async () => {
      const res = await api.get("/consultants/me");
      return res.data;
    },
    retry: 1,
  });

  if (isLoading) return <FullPageLoader />;

  const status = consultant?.status;

  if (status === "active") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === "rejected" || status === "banned" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <ShieldX className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Not Approved</h1>
            <p className="text-gray-500 mb-2">
              Your consultant account has been {status}. You cannot access the portal.
            </p>
            {consultant?.admin_notes && (
              <p className="text-sm text-gray-400 mb-6">Reason: {consultant.admin_notes}</p>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Approval</h1>
            <p className="text-gray-500 mb-6">
              Your consultant account is awaiting admin verification. You&apos;ll get access once an administrator approves your registration.
            </p>
          </>
        )}
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  useEffect(() => {
    if (!loading && role !== "consultant") {
      router.replace("/auth/login?error=forbidden");
    }
  }, [loading, role, router]);

  if (loading) return <FullPageLoader />;
  if (role !== "consultant") return null;

  return (
    <QueryClientProvider client={queryClient}>
      <PendingApprovalGate>
        <div className="min-h-screen bg-[#FAFAFA] flex">
          <Sidebar role="consultant" />
          <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <MobileBottomNav role="consultant" />
        </div>
      </PendingApprovalGate>
    </QueryClientProvider>
  );
}
