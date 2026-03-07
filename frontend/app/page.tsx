import Link from "next/link";
import { GraduationCap, Sparkles, FileText, Building2, Users, Star, ArrowRight, CheckCircle } from "lucide-react";
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
    title: "Build Your Profile",
    description: "Enter your academic history, test scores, and study preferences in minutes.",
  },
  {
    icon: Sparkles,
    title: "Get AI-Matched",
    description: "Our engine ranks universities by fit score using rankings, cost, and BD acceptance rates.",
  },
  {
    icon: Building2,
    title: "Apply with Confidence",
    description: "Track applications, upload documents, and connect with verified consultants.",
  },
];

const features = [
  "AI-powered university matching",
  "Real QS rankings & BD acceptance data",
  "One-click application tracking",
  "Verified consultant network",
  "Document management",
  "Scholarship finder",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/8 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">Find Your University</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/universities" className="text-slate-400 hover:text-white text-sm transition-colors">
              Universities
            </Link>
            <Link href="/agencies" className="text-slate-400 hover:text-white text-sm transition-colors">
              Agencies
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:bg-white/8">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register/student">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm mb-6">
          <Sparkles size={14} />
          AI-powered for Bangladeshi students
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Find Your Perfect
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> University</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Our AI matches your profile with over 1,200 universities worldwide.
          Get ranked results, AI summaries, and apply — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register/student">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold">
              Start Matching — Free <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
          <Link href="/universities">
            <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/8 px-8 py-3 text-base">
              Browse Universities
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Three simple steps to find and apply to your dream university.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="glass-card p-8 text-center glass-card-hover relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {i + 1}
                </div>
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-2">
                  <Icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
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
              <h2 className="text-3xl font-bold text-white mb-4">Everything you need to study abroad</h2>
              <p className="text-slate-400 mb-8">
                Built specifically for Bangladeshi students with real data on BD acceptance rates,
                scholarships, and verified consultant networks.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="glass-card p-5 border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Star size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">University of Toronto</div>
                    <div className="text-slate-500 text-xs">Canada • QS #21</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-green-400 font-bold text-lg">92%</div>
                    <div className="text-slate-500 text-xs">Match Score</div>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">TU Munich</div>
                    <div className="text-slate-500 text-xs">Germany • QS #37</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-blue-400 font-bold text-lg">85%</div>
                    <div className="text-slate-500 text-xs">Match Score</div>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass-card p-16 text-center border-blue-500/20"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))" }}>
          <h2 className="text-3xl font-bold text-white mb-4">Ready to find your university?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Join hundreds of Bangladeshi students who found their perfect university match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register/student">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold">
                Register as Student
              </Button>
            </Link>
            <Link href="/agencies">
              <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/8 px-8 py-3 text-base">
                <Users size={16} className="mr-2" /> Find an Agency
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <GraduationCap size={12} className="text-white" />
            </div>
            <span className="text-slate-400 text-sm">Find Your University © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/universities" className="hover:text-white transition-colors">Universities</Link>
            <Link href="/agencies" className="hover:text-white transition-colors">Agencies</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
