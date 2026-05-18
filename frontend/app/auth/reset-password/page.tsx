"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, [supabase.auth]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully");
    router.push("/auth/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-[#10B981] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-5">
            <KeyRound size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Verifying reset link...</h1>
          <p className="text-muted-foreground text-sm">Please wait while we verify your password reset link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#10B981] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-5">
            <CheckCircle2 size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">New password</h1>
          <p className="text-muted-foreground mt-1">Choose a strong password for your account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label className="text-secondary-foreground mb-2 block font-semibold text-sm">New Password</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <Label className="text-secondary-foreground mb-2 block font-semibold text-sm">Confirm Password</Label>
              <Input
                {...register("confirm")}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
              />
              {errors.confirm && <p className="text-red-500 text-xs mt-1.5">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
