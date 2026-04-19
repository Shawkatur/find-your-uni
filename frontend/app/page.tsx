"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, FileText, Building2, Users, Star, ArrowRight, CheckCircle, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "500+", label: "Students Matched" },
  { value: "1,200+", label: "Universities" },
  { value: "50+", label: "Countries" },
  { value: "78%", label: "Avg Acceptance" },
];

const steps = [
  {
    icon: FileText,
    title: "Tell us about you",
    description: "Drop in your grades, test scores, and where you want to study. Takes 5 minutes.",
  },
  {
    icon: Sparkles,
    title: "See your top picks",
    description: "We rank unis by fit using QS rankings, cost, and BD acceptance rates.",
  },
  {
    icon: Building2,
    title: "Apply and track it all",
    description: "Track apps, upload docs, and connect with verified consultants.",
  },
];

const features = [
  "Smart program matching that actually works",
  "Real QS rankings & BD acceptance data",
  "One-click application tracking",
  "Verified consultant network",
  "Document management",
  "Scholarship finder",
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#333]">
      {/* Nav */}
      <nav className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-black tracking-tight text-[#333] text-base">Find Your Uni</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/universities" className="text-[#64748B] hover:text-[#333] text-sm transition-colors font-medium">
              Universities
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register/student">
              <Button size="sm">Get Started</Button>
            </Link>
            <Link href="/auth/login/consultant" className="text-[#94A3B8] hover:text-[#64748B] text-xs transition-colors">
              Consultants
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#64748B] hover:text-[#333] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white px-6 py-4 flex flex-col gap-4">
            <Link href="/universities" onClick={() => setMenuOpen(false)} className="text-[#475569] hover:text-[#333] text-sm font-medium transition-colors">
              Universities
            </Link>
            <div className="flex gap-3 pt-1">
              <Link href="/auth/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" size="lg" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/register/student" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button size="lg" className="w-full">Get Started</Button>
              </Link>
            </div>
            <Link href="/auth/login/consultant" onClick={() => setMenuOpen(false)} className="text-[#94A3B8] text-xs text-center transition-colors">
              Are you a consultant?
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-20 text-center relative">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.06)] text-[#059669] text-sm font-semibold mb-8">
            <Sparkles size={14} />
            Built for Bangladeshi students
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-tight mb-6">
            Find your
            <br />
            <span className="text-emerald-600">
              perfect university
            </span>
          </h1>

          <p className="text-xl text-[#64748B] max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            We crunch your grades, scores, and budget against 1,200+ unis worldwide.
            Get ranked results and apply — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register/student">
              <Button size="lg" className="px-8">
                Get Started — Free <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
            <Link href="/universities">
              <Button variant="outline" size="lg" className="px-8">
                Explore Programs
              </Button>
            </Link>
          </div>

          {/* Micro-copy */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-4">
            <Check size={13} className="text-emerald-500" />
            No credit card required
          </div>

          {/* App Mockup */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            {/* Glow blob */}
            <div className="absolute -inset-8 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative rounded-xl border border-slate-200/50 bg-white shadow-2xl overflow-hidden">
              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                    <GraduationCap size={24} className="text-emerald-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Student Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 border-y border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black tracking-tight text-slate-900 mb-1">{stat.value}</div>
                <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black tracking-tight text-[#333] mb-4">How It Works</h2>
          <p className="text-[#64748B] max-w-xl mx-auto font-normal">Three steps. No fluff.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="glass-card glass-card-hover p-8 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-500/30">
                  {i + 1}
                </div>
                <div className="relative inline-flex mb-6 mt-2">
                  <div className="w-14 h-14 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-2xl flex items-center justify-center">
                    <Icon size={24} className="text-[#10B981]" />
                  </div>
                </div>
                <h3 className="text-lg font-black tracking-tight text-[#333] mb-2">{step.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed font-normal">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass-card p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#333] mb-4">
                Everything you need to study abroad
              </h2>
              <p className="text-[#64748B] mb-8 font-normal leading-relaxed">
                Built for Bangladeshi students with real data on BD acceptance rates,
                scholarships, and verified consultant networks.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-[#475569]">
                    <CheckCircle size={16} className="text-[#10B981] shrink-0" />
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {/* Preview card 1 */}
              <div className="glass-card p-5 border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.3)] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[rgba(16,185,129,0.06)] rounded-xl flex items-center justify-center">
                    <Star size={18} className="text-[#10B981]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#333] font-black tracking-tight text-sm">University of Toronto</div>
                    <div className="text-[#64748B] text-xs font-medium">Canada · QS #21</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#059669] font-black text-xl tracking-tight">92%</div>
                    <div className="text-[#64748B] text-xs">Fit Score</div>
                  </div>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full" style={{ width: "92%" }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="tag-pill tag-pill-green">Great Fit</span>
                  <span className="tag-pill tag-pill-blue">Scholarship</span>
                </div>
              </div>

              {/* Preview card 2 */}
              <div className="glass-card p-5 hover:border-[#CBD5E1] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[rgba(59,130,246,0.06)] rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-[#3B82F6]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#333] font-black tracking-tight text-sm">TU Munich</div>
                    <div className="text-[#64748B] text-xs font-medium">Germany · QS #37</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#2563EB] font-black text-xl tracking-tight">85%</div>
                    <div className="text-[#64748B] text-xs">Fit Score</div>
                  </div>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="tag-pill tag-pill-blue">Good Fit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass-card p-16 text-center border-[rgba(16,185,129,0.15)] relative overflow-hidden bg-[rgba(16,185,129,0.02)]">
          <div className="relative">
            <h2 className="text-4xl font-black tracking-tight text-[#333] mb-4">Ready to find your program?</h2>
            <p className="text-[#64748B] mb-10 max-w-md mx-auto font-normal leading-relaxed">
              Join hundreds of Bangladeshi students who found their perfect program match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register/student">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/agencies">
                <Button variant="outline" size="lg" className="px-8">
                  <Users size={16} className="mr-2" /> Find an Agency
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#10B981] rounded-lg flex items-center justify-center">
              <GraduationCap size={14} className="text-white" />
            </div>
            <span className="text-[#64748B] text-sm font-medium">Find Your Uni © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-[#64748B]">
            <Link href="/universities" className="hover:text-[#333] transition-colors font-medium">Universities</Link>
            <Link href="/auth/login" className="hover:text-[#333] transition-colors font-medium">Sign In</Link>
            <Link href="/auth/login/consultant" className="hover:text-[#333] transition-colors font-medium">Consultants</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
