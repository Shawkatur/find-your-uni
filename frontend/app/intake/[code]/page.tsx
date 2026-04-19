"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, AlertCircle, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import type { IntakeInfo } from "@/types";

const REF_STORAGE_KEY = "findyouruni_ref_code";

export default function IntakePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;

  const [info, setInfo] = useState<IntakeInfo | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    api
      .get<IntakeInfo>(`/intake/info/${code}`)
      .then((r) => setInfo(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code]);

  // Unified auth: the "Continue" button stores the ref code and email,
  // then navigates to the registration page. The backend will handle
  // routing to either Login or Signup based on whether the email exists.
  const handleContinue = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(REF_STORAGE_KEY, code);
    }
    const params = new URLSearchParams({ ref: code });
    if (email.trim()) params.set("email", email.trim());
    router.push(`/auth/register/student?${params.toString()}`);
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
            {/* Branding — no icon, text-only header */}
            {info.is_admin ? (
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Find Your University</h2>
                <p className="text-slate-500 text-sm">Official student intake portal</p>
              </div>
            ) : (
              <div className="text-center mb-6">
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
            <ul className="space-y-3 mb-7">
              {[
                "Personalized, data-driven university matching",
                "Personalized university recommendations",
                "Instant, accurate program matching",
                "Expert-level university shortlisting",
              ].map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            {/* Unified auth: single email input + Continue CTA.
                Backend will route to Login or Signup based on whether the email exists. */}
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              />
              <button
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-2 btn-electric py-3 rounded-xl font-semibold text-sm"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
