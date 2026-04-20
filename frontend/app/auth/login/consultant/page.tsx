"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

function ConsultantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const role = authData.user?.app_metadata?.role ?? authData.user?.user_metadata?.role ?? "student";
    if (role !== "consultant") {
      await supabase.auth.signOut();
      toast.error("This login is for consultants only.");
      return;
    }
    router.push(searchParams.get("next") || "/consultant/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)", filter: "blur(20px)" }} />
            <div className="relative w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
              <Briefcase size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Consultant Sign In</h1>
          <p className="text-slate-400 mt-1 font-normal">Access your agency dashboard and student pipeline</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label className="text-slate-300 mb-2 block font-semibold text-sm">Email</Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="you@agency.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block font-semibold text-sm">Password</Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-slate-400 text-sm">
              New consultant?{" "}
              <Link href="/auth/register/consultant" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Register your agency
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link href="/auth/login" className="hover:text-slate-300 transition-colors">← Choose account type</Link>
        </p>
      </div>
    </div>
  );
}

export default function ConsultantLoginPage() {
  return (
    <Suspense fallback={null}>
      <ConsultantLoginForm />
    </Suspense>
  );
}
