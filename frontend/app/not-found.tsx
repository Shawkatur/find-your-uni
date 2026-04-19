import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
          <GraduationCap size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 text-lg mb-8">This page doesn't exist or has been moved.</p>
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
