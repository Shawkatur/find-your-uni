"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import axios from "axios";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  agency_name: z.string().min(2, "Agency name required"),
  role_title: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ConsultantRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1. Supabase signup
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name, role: "consultant" } },
      });
      if (authErr && !authErr.message.includes("already") && !authErr.message.includes("rate")) {
        throw authErr;
      }

      // 2. Get session — signUp may not return one (email confirmation), so try signIn
      let accessToken = authData?.session?.access_token;
      if (!accessToken) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInErr) throw signInErr;
        accessToken = signInData.session?.access_token;
      }
      if (!accessToken) {
        toast.error("Please confirm your email and try signing in.");
        return;
      }
      const headers = { Authorization: `Bearer ${accessToken}` };

      // 3. Register consultant profile (backend creates agency from agency_name)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      await axios.post(`${apiUrl}/auth/consultant/register`, {
        agency_name: data.agency_name,
        full_name: data.full_name,
        phone: data.phone,
        role_title: data.role_title,
        role: "staff",
      }, { headers });

      toast.success("Consultant account created!");
      router.push("/consultant/dashboard");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = err as any;
      if (axiosErr?.response?.status === 409) {
        toast.success("Welcome back!");
        router.push("/consultant/dashboard");
        return;
      }
      const detail = axiosErr?.response?.data?.detail;
      const msg = detail ?? (err instanceof Error ? err.message : "Registration failed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
            <GraduationCap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Consultant Registration</h1>
          <p className="text-slate-400 text-sm mt-1">Create your consultant account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label className="text-slate-300 mb-1.5 block">Full Name</Label>
                <Input {...register("full_name")} placeholder="Your name"
                  className="bg-white/8 border-white/10 text-white placeholder:text-slate-500" />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label className="text-slate-300 mb-1.5 block">Email</Label>
                <Input {...register("email")} type="email" placeholder="consultant@agency.com"
                  className="bg-white/8 border-white/10 text-white placeholder:text-slate-500" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label className="text-slate-300 mb-1.5 block">Password</Label>
                <Input {...register("password")} type="password" placeholder="Min. 8 characters"
                  className="bg-white/8 border-white/10 text-white placeholder:text-slate-500" />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <Label className="text-slate-300 mb-1.5 block">Phone</Label>
                <Input {...register("phone")} placeholder="+880 17..."
                  className="bg-white/8 border-white/10 text-white placeholder:text-slate-500" />
              </div>
              <div>
                <Label className="text-slate-300 mb-1.5 block">Agency Name</Label>
                <Input {...register("agency_name")} placeholder="Your agency name"
                  className="bg-white/8 border-white/10 text-white placeholder:text-slate-500" />
                {errors.agency_name && <p className="text-red-400 text-xs mt-1">{errors.agency_name.message}</p>}
              </div>
              <div>
                <Label className="text-slate-300 mb-1.5 block">Role / Title</Label>
                <Input {...register("role_title")} placeholder="e.g. Senior Consultant"
                  className="bg-white/8 border-white/10 text-white placeholder:text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
            >
              {loading ? "Creating account..." : "Create Consultant Account"}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/auth/login/consultant" className="text-blue-400 hover:text-blue-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
