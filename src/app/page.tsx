import * as React from "react"
import Link from "next/link"
import { 
  ArrowRight, Users, Award, 
  Shield, Globe2, Zap, DollarSign,
  Star, Smartphone, CheckCircle, Mic, FileText, Search
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-background section-pattern">
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full opacity-20 dark:opacity-15 blur-[120px]" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in text-center lg:text-start">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-primary/20 bg-primary/5 text-primary shadow-sm">
                <Zap className="w-4 h-4 fill-primary text-primary" />
                <span>Trusted by 12,500+ Qualified Freelancers</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
                  Earn Income by
                  <span className="block gradient-text">Powering Modern AI</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  SHEHAB TECH bridges talented contributors with top-tier AI training programs. Complete voice recordings, transcription, and data labeling from anywhere.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base sm:text-lg font-bold">
                  Start Earning Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/projects" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base sm:text-lg font-bold border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-all text-foreground">
                  Explore Active Tasks
                </Link>
              </div>

              {/* Guarantees */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2">
                {[
                  { icon: CheckCircle, text: "Free to Join & Work" },
                  { icon: Shield, text: "Reliable Payouts" },
                  { icon: Globe2, text: "Arabic & Global Dialects" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground/70">
                    <item.icon className="w-4 h-4 text-emerald-500" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live Interactive Platform Preview */}
            <div className="relative animate-slide-up stagger-2 hidden lg:block">
              {/* Main Dashboard Widget Card */}
              <div className="glass rounded-3xl p-7 space-y-6 shadow-2xl relative border border-border/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">Live Contributor Portal</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active Tasks Available</span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground/50 mb-1">Task Earning Payout</p>
                  <div className="text-4xl font-black text-foreground tracking-tight">$45<span className="text-xl text-foreground/50">.00</span></div>
                </div>
                
                {/* Wave / Metric Chart Visualization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground/50 font-medium">
                    <span>Performance Rating</span>
                    <span className="text-primary font-bold">99.2% Accuracy</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16 pt-2">
                    {[35, 55, 42, 78, 50, 88, 65, 92, 70, 98, 85, 96].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 rounded-t transition-all hover:opacity-100" 
                        style={{ 
                          height: `${h}%`, 
                          background: i >= 9 ? 'linear-gradient(to top, #4f46e5, #7c3aed)' : 'rgba(99,102,241,0.2)',
                          opacity: i >= 9 ? 1 : 0.7
                        }} 
                      />
                    ))}
                  </div>
                </div>
                
                {/* Micro Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  {[
                    { label: 'Sentences Recorded', value: '450+', color: 'text-emerald-500' },
                    { label: 'Quality Score', value: '100%', color: 'text-primary' },
                    { label: 'Payout Speed', value: '<24h', color: 'text-amber-500' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
                      <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-foreground/50 font-semibold">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Task Badge */}
              <div className="absolute -top-4 -right-4 glass rounded-2xl p-3.5 flex items-center gap-3 shadow-xl animate-float border border-primary/20">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">New Voice Task</p>
                  <p className="text-[10px] text-emerald-500 font-semibold">Verified & Instant Payout</p>
                </div>
              </div>

              {/* Floating Payment Badge */}
              <div className="absolute -bottom-4 -left-4 glass rounded-2xl p-3.5 flex items-center gap-3 shadow-xl border border-emerald-500/20">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Payment Transferred</p>
                  <p className="text-[10px] text-foreground/50">Vodafone Cash / Bank Account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NUMBERS & CREDIBILITY ─── */}
      <section className="py-14 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Contributors", value: "12,500+", icon: Users, color: "#4f46e5" },
              { label: "Dialects & Languages", value: "100+", icon: Globe2, color: "#7c3aed" },
              { label: "AI Quality Approval", value: "99.1%", icon: Award, color: "#10b981" },
              { label: "Completed Projects", value: "100+", icon: Star, color: "#f59e0b" },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-3xl md:text-4xl font-black text-foreground">{stat.value}</div>
                <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (SIMPLE & CLEAR) ─── */}
      <section id="about" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">Seamless Workflow</span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">Start Working in <span className="gradient-text">4 Simple Steps</span></h2>
            <p className="text-foreground/60 text-base sm:text-lg">No complicated onboarding. Jump straight into projects matching your skills.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {[
              { step: "01", title: "Create Account", desc: "Register your free account with your email and basic details.", icon: Smartphone },
              { step: "02", title: "Verify Profile", desc: "Fast identification verification to guarantee work authenticity.", icon: Shield },
              { step: "03", title: "Select Tasks", desc: "Browse open voice recording and transcription batches.", icon: Search },
              { step: "04", title: "Receive Payout", desc: "Get reviewed by automated QC and withdraw your compensation.", icon: DollarSign },
            ].map((step, i) => (
              <div key={i} className="relative glass p-6 rounded-2xl border border-border/80 card-hover flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/10 text-primary">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white bg-primary shadow-md">{step.step}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-24 bg-card/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">Project Domains</span>
                <h2 className="text-3xl sm:text-5xl font-black text-foreground">Diverse Range of <span className="gradient-text">AI Opportunities</span></h2>
                <p className="text-foreground/70 text-base sm:text-lg">Contribute to state-of-the-art Natural Language Processing, computer vision, and speech recognition engines.</p>
              </div>
              
              <div className="space-y-3">
                {[
                  { title: "Voice & Speech Recording", desc: "Read natural scripted sentences in your native Egyptian, Gulf, or Levantine dialect.", icon: Mic, color: "#4f46e5" },
                  { title: "Audio Transcription & QC", desc: "Listen and proofread sentences for phonetic accuracy and background noise compliance.", icon: FileText, color: "#7c3aed" },
                  { title: "Computer Vision & Annotation", desc: "Tag bounding boxes and categorize real-world images for machine perception.", icon: Search, color: "#10b981" },
                  { title: "Content Moderation & Safety", desc: "Assess generative AI prompt answers for truthfulness, tone, and safety guidelines.", icon: Shield, color: "#f59e0b" },
                ].map((service, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl transition-all hover:bg-card card-hover border border-border/40">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${service.color}15` }}>
                      <service.icon className="w-6 h-6" style={{ color: service.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base">{service.title}</h3>
                      <p className="text-sm text-foreground/60 mt-0.5">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              <div className="glass rounded-3xl p-8 space-y-6 border border-border/80 shadow-xl">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Contributor Feedback
                  </h3>
                  <span className="text-xs text-foreground/50 font-semibold">Verified Freelancers</span>
                </div>

                {[
                  { name: "Ahmed M.", role: "Voice Talent · Cairo, Egypt", text: "Completed recording batches on Shehab Tech. The web recorder and live waveform make it extremely easy to verify my voice before sending. Payments arrive promptly.", rating: 5 },
                  { name: "Sara K.", role: "Transcriptionist · Alexandria", text: "The cleanest dashboard I have worked with for data collection. Clear instructions, fair pricing, and immediate support from supervisors.", rating: 5 },
                ].map((t, i) => (
                  <div key={i} className="space-y-2.5 pb-5 last:pb-0 border-b last:border-0 border-border/50">
                    <div className="flex gap-1">
                      {Array(t.rating).fill(0).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/75 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-foreground/50">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION ─── */}
      <section className="py-24 relative overflow-hidden bg-background section-pattern">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">
              Ready to Start Earning with <span className="gradient-text">SHEHAB TECH?</span>
            </h2>
            <p className="text-base sm:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Create your account in seconds, access verified data collection projects, and get paid directly.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-base sm:text-lg font-bold shadow-xl shadow-primary/25">
              Register Free Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/projects" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base sm:text-lg font-bold border border-border bg-card/60 hover:bg-card transition-all text-foreground">
              Browse Available Projects
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs sm:text-sm text-foreground/60 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Zero Signup Fees</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Direct Mobile Wallet / Bank Withdrawals</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Work from Mobile or PC</span>
          </div>
        </div>
      </section>
    </div>
  )
}
