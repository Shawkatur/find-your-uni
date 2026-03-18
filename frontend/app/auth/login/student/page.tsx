"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function StudentLoginPage() {
  const router = useRouter();
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
    router.push(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="glow-blue" />
            <div className="relative w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
              <GraduationCap size={30} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Student Sign In</h1>
          <p className="text-slate-400 mt-1 font-normal">Access your university matches and applications</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label className="text-slate-300 mb-2 block font-semibold text-sm">Email</Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
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
              className="w-full mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-slate-400 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register/student" className="text-blue-400 hover:text-blue-300 font-semibold">
                Register as Student
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
