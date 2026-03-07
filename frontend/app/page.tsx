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
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-black tracking-tight text-white text-base">Find Your University</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/universities" className="text-slate-400 hover:text-white text-sm transition-colors font-medium">
              Universities
            </Link>
            <Link href="/agencies" className="text-slate-400 hover:text-white text-sm transition-colors font-medium">
              Agencies
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register/student">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-20 text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-semibold mb-8">
            <Sparkles size={14} />
            AI-powered for Bangladeshi students
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none mb-6">
            Find Your Perfect
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              University
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Our AI matches your profile with over 1,200 universities worldwide.
            Get ranked results, AI summaries, and apply — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register/student">
              <Button size="lg" className="px-8">
                Start Matching — Free <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
            <Link href="/universities">
              <Button variant="outline" size="lg" className="px-8">
                Browse Universities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center hover:border-blue-500/20 transition-colors">
              <div className="text-3xl font-black tracking-tight text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black tracking-tight text-white mb-4">How It Works</h2>
          <p className="text-slate-400 max-w-xl mx-auto font-normal">Three simple steps to find and apply to your dream university.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="glass-card glass-card-hover p-8 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-600/40">
                  {i + 1}
                </div>
                <div className="relative inline-flex mb-6 mt-2">
                  <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                    <Icon size={24} className="text-blue-400" />
                  </div>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-normal">{step.description}</p>
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
              <h2 className="text-3xl font-black tracking-tight text-white mb-4">
                Everything you need to study abroad
              </h2>
              <p className="text-slate-400 mb-8 font-normal leading-relaxed">
                Built specifically for Bangladeshi students with real data on BD acceptance rates,
                scholarships, and verified consultant networks.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {/* Preview card 1 */}
              <div className="glass-card p-5 border-blue-500/20 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Star size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-black tracking-tight text-sm">University of Toronto</div>
                    <div className="text-slate-500 text-xs font-medium">Canada · QS #21</div>
                  </div>
                  <div className="text-right">
                    <div className="relative inline-block">
                      <div className="glow-green" style={{ inset: "-8px" }} />
                      <div className="relative text-emerald-400 font-black text-xl tracking-tight">92%</div>
                    </div>
                    <div className="text-slate-500 text-xs">Match Score</div>
                  </div>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: "92%" }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="tag-pill tag-pill-green">High Match</span>
                  <span className="tag-pill tag-pill-blue">Scholarship</span>
                </div>
              </div>

              {/* Preview card 2 */}
              <div className="glass-card p-5 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-black tracking-tight text-sm">TU Munich</div>
                    <div className="text-slate-500 text-xs font-medium">Germany · QS #37</div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-black text-xl tracking-tight">85%</div>
                    <div className="text-slate-500 text-xs">Match Score</div>
                  </div>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="tag-pill tag-pill-blue">Good Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div
          className="glass-card p-16 text-center border-blue-500/20 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(147,51,234,0.1))" }}
        >
          {/* background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl font-black tracking-tight text-white mb-4">Ready to find your university?</h2>
            <p className="text-slate-300 mb-10 max-w-md mx-auto font-normal leading-relaxed">
              Join hundreds of Bangladeshi students who found their perfect university match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register/student">
                <Button size="lg" className="px-8">
                  Register as Student
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
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={14} className="text-white" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Find Your University © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/universities" className="hover:text-slate-300 transition-colors font-medium">Universities</Link>
            <Link href="/agencies" className="hover:text-slate-300 transition-colors font-medium">Agencies</Link>
            <Link href="/auth/login" className="hover:text-slate-300 transition-colors font-medium">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
