"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { t } = useTranslation();
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

    const rawRole = authData.user?.app_metadata?.role ?? authData.user?.user_metadata?.role ?? "student";
    if (rawRole !== "student") {
      await supabase.auth.signOut();
      toast.error("This login is for students only. Please use the admin portal.");
      return;
    }
    const next = searchParams.get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/student/dashboard";
    router.push(safeNext);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="relative w-16 h-16 bg-[#10B981] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <GraduationCap size={30} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t("auth.welcomeBack")}</h1>
          <p className="text-muted-foreground mt-1 font-normal">Sign in to your student account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label className="text-secondary-foreground mb-2 block font-semibold text-sm">Email</Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="text-secondary-foreground mb-2 block font-semibold text-sm">Password</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-xs text-[#10B981] hover:text-[#059669] font-medium">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
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

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              {t("auth.noAccount")}{" "}
              <Link href="/auth/register/student" className="text-[#10B981] hover:text-[#059669] font-semibold">
                {t("common.register")}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          <Link href="/auth/login" className="hover:text-muted-foreground transition-colors">← Choose account type</Link>
        </p>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={null}>
      <StudentLoginForm />
    </Suspense>
  );
}
