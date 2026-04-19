"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, Building2, AlertCircle, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import type { IntakeInfo } from "@/types";

export default function IntakePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;

  const [info, setInfo] = useState<IntakeInfo | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<IntakeInfo>(`/intake/info/${code}`)
      .then((r) => setInfo(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code]);

  const handleCTA = () => {
    router.push(`/auth/register/student?ref=${code}`);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-black tracking-tight text-white text-base leading-none">Find Your</div>
              <div className="font-black tracking-tight text-blue-400 text-base leading-tight">University</div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="glass-card p-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="glass-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Link Not Found</h2>
            <p className="text-slate-500 text-sm">
              This intake link is invalid or has expired. Please contact the consultant who shared it.
            </p>
          </div>
        )}

        {info && (
          <div className="glass-card p-8">
            {/* Branding */}
            {info.is_admin ? (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <GraduationCap size={30} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Find Your University</h2>
                <p className="text-slate-500 text-sm">Official student intake portal</p>
              </div>
            ) : (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                  <Building2 size={28} className="text-indigo-600" />
                </div>
                {info.agency_name && (
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-semibold">
                    {info.agency_name}
                  </p>
                )}
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {info.consultant_name ?? "Your Consultant"}
                </h2>
                <p className="text-slate-500 text-sm">
                  invites you to find your ideal university
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 my-6" />

            {/* Value props */}
            <ul className="space-y-2.5 mb-7">
              {[
                "AI-powered university matching",
                "Tailored to Bangladeshi students",
                "Free — no hidden costs",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            <button
              onClick={handleCTA}
              className="w-full flex items-center justify-center gap-2 btn-electric py-3 rounded-xl font-semibold text-sm"
            >
              Get Started Free
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-slate-500 text-xs mt-4">
              Already have an account?{" "}
              <a href="/auth/login" className="text-emerald-600 hover:text-emerald-700">
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
