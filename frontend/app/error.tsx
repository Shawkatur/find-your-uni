"use client";

import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
          <GraduationCap size={28} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-500 mb-8">An unexpected error occurred. Please try again.</p>
        <Button size="lg" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
