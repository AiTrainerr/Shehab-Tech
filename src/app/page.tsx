import * as React from "react"
import Link from "next/link"
import { 
  ArrowRight, Users, Award, 
  Shield, Globe2, Zap, DollarSign,
  Star, Smartphone, CheckCircle, Mic, FileText, Search,
  Headphones, Database, Layers, CheckSquare, Lock, Phone, Mail, MessageSquare
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background section-pattern">
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full opacity-20 dark:opacity-15 blur-[120px]" style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in text-center lg:text-start">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-primary/20 bg-primary/5 text-primary shadow-sm">
                <Zap className="w-4 h-4 fill-primary text-primary" />
                <span>SHEHAB TECH · COMPANY PROFILE 2026</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
                  Data Collection &
                  <span className="block gradient-text">AI Solutions</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-foreground/75 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  We provide high-quality data collection and AI training datasets tailored for multilingual applications. Built for AI labs and technology companies.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 justify-center lg:justify-start text-xs font-semibold text-foreground/60">
                  <span className="px-3 py-1 bg-card rounded-lg border border-border">Audio Production</span>
                  <span className="px-3 py-1 bg-card rounded-lg border border-border">Audio Transcription</span>
                  <span className="px-3 py-1 bg-card rounded-lg border border-border">Data Annotation</span>
                  <span className="px-3 py-1 bg-card rounded-lg border border-border">AI Training Data</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base sm:text-lg font-bold">
                  Join as Expert Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/projects" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base sm:text-lg font-bold border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-all text-foreground">
                  Browse Active Tasks
                </Link>
              </div>

              {/* Pillars */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2">
                {[
                  { icon: CheckCircle, text: "High Precision (Multi-Stage QC)" },
                  { icon: Shield, text: "Strict Data Confidentiality" },
                  { icon: Globe2, text: "100+ Covered Languages" },
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
              <div className="glass rounded-3xl p-7 space-y-6 shadow-2xl relative border border-border/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">Global Operations Center</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">Production Ready</span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground/50 mb-1">Expert Network Deployment</p>
                  <div className="text-4xl font-black text-foreground tracking-tight">2,000+ <span className="text-xl text-foreground/50 font-medium">Linguists & Experts</span></div>
                </div>
                
                {/* Metric Waves */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground/50 font-medium">
                    <span>Quality Assurance Acceptance</span>
                    <span className="text-primary font-bold">Multi-Stage Verified</span>
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
                    { label: 'Global Languages', value: '100+', color: 'text-primary' },
                    { label: 'Long-Form Audio', value: 'Studio WAV', color: 'text-emerald-500' },
                    { label: 'Completed Batches', value: '100+', color: 'text-amber-500' },
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
                  <p className="text-xs font-bold text-foreground">Long-Form Audio</p>
                  <p className="text-[10px] text-emerald-500 font-semibold">16kHz / 44.1kHz Multi-Dialect</p>
                </div>
              </div>

              {/* Floating Payment Badge */}
              <div className="absolute -bottom-4 -left-4 glass rounded-2xl p-3.5 flex items-center gap-3 shadow-xl border border-emerald-500/20">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Reliable Payouts</p>
                  <p className="text-[10px] text-foreground/50">Fast Automated Verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NUMBERS & WHY PARTNER WITH US ─── */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">Why Partner With Us</span>
            <h2 className="text-3xl font-black text-foreground">Data Driving the AI Future</h2>
            <p className="text-sm text-foreground/60">Managing a vast network of 2,000+ experts to support AI operations at scale.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Global Experts", value: "2,000+", icon: Users, color: "#4f46e5", sub: "Vetted language specialists" },
              { label: "Languages Covered", value: "100+", icon: Globe2, color: "#7c3aed", sub: "Major & regional dialects" },
              { label: "Delivered Projects", value: "100+", icon: Star, color: "#10b981", sub: "AI-ready training datasets" },
              { label: "Quality System", value: "5-Stage", icon: Award, color: "#f59e0b", sub: "Rigorous QA verification" },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2 group p-4 rounded-2xl bg-background/50 border border-border/60">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-3xl font-black text-foreground">{stat.value}</div>
                <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider">{stat.label}</div>
                <p className="text-[11px] text-foreground/50">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* 4 Pillars */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {[
              { title: "High Precision", desc: "High accuracy backed by multi-stage quality control.", icon: CheckSquare },
              { title: "Scalable Capacity", desc: "Flexible teams that grow with your demand.", icon: Layers },
              { title: "Audio Production", desc: "Long-form recording and transcription at scale.", icon: Headphones },
              { title: "AI-Ready Data", desc: "Clean, structured data built specifically for AI models.", icon: Database },
            ].map((p, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/80 bg-background/70 space-y-2">
                <p.icon className="w-6 h-6 text-primary mb-1" />
                <h3 className="font-bold text-foreground text-base">{p.title}</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT WE DO (4 CORE SERVICES) ─── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">What We Do</span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">End-to-End <span className="gradient-text">Multilingual Data Services</span></h2>
            <p className="text-foreground/70 text-base sm:text-lg">
              From recording to transcription to finished training datasets, delivered by language experts and managed by a dedicated core team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { 
                num: "01", 
                title: "Long-Form Audio Production", 
                desc: "Recording and production of extended audio in your target languages, dialects and accents.",
                icon: Mic,
                color: "#4f46e5"
              },
              { 
                num: "02", 
                title: "Audio Transcription", 
                desc: "High-precision transcription backed by multi-stage quality control, across all supported languages.",
                icon: FileText,
                color: "#7c3aed"
              },
              { 
                num: "03", 
                title: "Data Annotation", 
                desc: "Structured labeling of multilingual data, such as audio and text, to train and evaluate AI models.",
                icon: Search,
                color: "#10b981"
              },
              { 
                num: "04", 
                title: "Multilingual Data Collection & AI Training Datasets", 
                desc: "Custom datasets collected and structured for training and evaluating AI models.",
                icon: Database,
                color: "#f59e0b"
              },
            ].map((service, i) => (
              <div key={i} className="glass p-7 rounded-3xl border border-border/80 card-hover space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${service.color}15` }}>
                    <service.icon className="w-6 h-6" style={{ color: service.color }} />
                  </div>
                  <span className="text-2xl font-black text-foreground/20">{service.num}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                <p className="text-sm text-foreground/65 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>

          {/* Value Props for AI Teams */}
          <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/20 grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-foreground mb-1">Consistent Quality</h4>
              <p className="text-xs text-foreground/60">Strict QA across every single language in your project pipeline.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">Accountable Core Team</h4>
              <p className="text-xs text-foreground/60">One dedicated project manager and team as your single point of contact.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">Scalable Capacity</h4>
              <p className="text-xs text-foreground/60">Seamless capacity that scales up or down with your AI data roadmap.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LANGUAGE COVERAGE & REGIONAL POWERHOUSE ─── */}
      <section className="py-24 bg-card/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">Multilingual Capacity</span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground">Language Coverage at Scale</h2>
            <p className="text-foreground/70 text-base">Comprehensive multilingual support, from major world languages to regional dialects.</p>
          </div>

          {/* Tiers */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass p-7 rounded-3xl border border-primary/30 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">TIER 1 · High-Volume</div>
              <p className="text-xs text-foreground/50">100+ expert capacity per language</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Arabic (All Dialects)", "Turkish", "English", "French", "German", "Malay", "Indonesian"].map((lang, i) => (
                  <span key={i} className="px-3 py-1.5 bg-background rounded-xl text-xs font-bold border border-border text-foreground">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass p-7 rounded-3xl border border-border/80 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">TIER 2 · Mid-Range</div>
              <p className="text-xs text-foreground/50">30–50+ expert capacity per language</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Hindi", "Urdu", "Portuguese", "Spanish", "Swedish"].map((lang, i) => (
                  <span key={i} className="px-3 py-1.5 bg-background rounded-xl text-xs font-bold border border-border text-foreground">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass p-7 rounded-3xl border border-border/80 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">TIER 3 · Niche & Specialized</div>
              <p className="text-xs text-foreground/50">Specialized expert pool</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Pashto", "Persian", "Punjabi", "Bengali", "Thai"].map((lang, i) => (
                  <span key={i} className="px-3 py-1.5 bg-background rounded-xl text-xs font-bold border border-border text-foreground">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Regional Table */}
          <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-5">
            <h3 className="text-xl font-bold text-foreground">Regional Powerhouse: Agile & Region-Focused Teams</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground/50">
                    <th className="pb-3 font-bold">Region</th>
                    <th className="pb-3 font-bold">Team Locations</th>
                    <th className="pb-3 font-bold">Focus Languages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="py-4 font-bold text-foreground">Middle East & North Africa</td>
                    <td className="py-4 text-foreground/70">Egypt, Emirates, Saudi Arabia & regional network</td>
                    <td className="py-4 font-medium text-primary">Arabic and its regional dialects</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-foreground">Europe</td>
                    <td className="py-4 text-foreground/70">Participant network distributed across the region</td>
                    <td className="py-4 font-medium text-primary">English, French, German, Spanish, Turkish</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-foreground">Asia</td>
                    <td className="py-4 text-foreground/70">Participant network distributed across the region</td>
                    <td className="py-4 font-medium text-primary">Turkish, Urdu, Hindi & Asian languages</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW WE WORK (4 STEPS: SCOPE -> ASSEMBLE -> PRODUCE -> DELIVER) ─── */}
      <section id="about" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">How We Work</span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">From Brief to <span className="gradient-text">Delivery</span></h2>
            <p className="text-foreground/60 text-base sm:text-lg">A simple, transparent workflow led by your dedicated Shehab Tech core team.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Scope", desc: "We define languages, volumes, audio formats and quality targets with your team.", icon: Search },
              { step: "02", title: "Assemble", desc: "Your core team is assigned and matched with qualified native language experts.", icon: Users },
              { step: "03", title: "Produce", desc: "Experts record, transcribe and annotate under strict core-team supervision.", icon: Mic },
              { step: "04", title: "Deliver", desc: "AI-ready datasets delivered on schedule in your required format (WAV, JSON, etc.).", icon: CheckCircle },
            ].map((step, i) => (
              <div key={i} className="glass p-6 rounded-3xl border border-border/80 card-hover flex flex-col items-center text-center space-y-4">
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

      {/* ─── 5-STAGE QUALITY SYSTEM & DATA SECURITY ─── */}
      <section className="py-24 bg-card/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Quality Stages */}
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">Quality System</span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground">Multi-Stage Quality Assurance</h2>
              <p className="text-foreground/70 text-sm leading-relaxed">
                A structured, multi-stage system for reviewing and verifying data before it reaches your AI models.
              </p>

              <div className="space-y-3">
                {[
                  { num: "1", title: "Expert Selection & Testing", desc: "Experts are tested on language proficiency and project fit." },
                  { num: "2", title: "Project Guidelines", desc: "Comprehensive instructions and audio specs provided before kickoff." },
                  { num: "3", title: "Multi-Stage Review", desc: "Checked for acoustic compliance, sample rate, and transcription accuracy." },
                  { num: "4", title: "Error Correction", desc: "Any flagged recording is documented and returned for re-recording." },
                  { num: "5", title: "Final Review", desc: "Final verification against client-agreed acceptance criteria before delivery." },
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-2xl bg-background/60 border border-border/60">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                      {q.num}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{q.title}</h4>
                      <p className="text-xs text-foreground/60">{q.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Security */}
            <div className="glass rounded-3xl p-8 border border-border/80 space-y-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Data Security & Confidentiality</h3>
                  <p className="text-xs text-foreground/50">Protecting your IP and proprietary training data</p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-foreground/75 divide-y divide-border/50">
                <div className="pt-2">
                  <p className="font-bold text-foreground">Strict Confidentiality</p>
                  <p className="text-foreground/60">Handling project info in line with strict bilateral NDAs and agreements.</p>
                </div>
                <div className="pt-3">
                  <p className="font-bold text-foreground">Access Control</p>
                  <p className="text-foreground/60">Encrypted token access; only assigned, verified personnel can access task files.</p>
                </div>
                <div className="pt-3">
                  <p className="font-bold text-foreground">Secure Data Handling & Deletion</p>
                  <p className="text-foreground/60">Encrypted transmission via Cloudinary/Supabase and automatic data retention purge.</p>
                </div>
                <div className="pt-3">
                  <p className="font-bold text-foreground">Compliance Standards</p>
                  <p className="text-foreground/60">Adherence to international GDPR and PCI-DSS compliance frameworks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LEADERSHIP & DIRECT CONTACT ─── */}
      <section className="py-24 relative overflow-hidden bg-background section-pattern">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-10">
          
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10">Our Vision</span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Bridging the Gap Between <span className="gradient-text">Human Language & Technology</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Through expert data solutions, we connect linguistic diversity with technological innovation. Powered by accuracy and massive scale.
            </p>
          </div>

          {/* Contact Card */}
          <div className="glass p-8 sm:p-10 rounded-3xl border border-border/80 max-w-2xl mx-auto text-left space-y-6 shadow-2xl">
            <div className="border-b border-border/60 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-foreground">Abdallah Shehab</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">CEO & Founder · SHEHAB TECH</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 w-fit">
                Open for Partnerships
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <a href="mailto:info@shehab-tech.com" className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-all group">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/50">Email</p>
                  <p className="font-semibold text-foreground text-xs truncate">info@shehab-tech.com</p>
                </div>
              </a>

              <a href="https://wa.me/201026744042" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-emerald-500/40 transition-all group">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/50">WhatsApp / Call</p>
                  <p className="font-semibold text-foreground text-xs">+20 1026 744 042</p>
                </div>
              </a>

              <a href="https://www.linkedin.com/in/abdallah-shehab" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-all group">
                <Globe2 className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/50">LinkedIn</p>
                  <p className="font-semibold text-foreground text-xs">abdallah-shehab</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/50">WeChat ID</p>
                  <p className="font-semibold text-foreground text-xs font-mono">AS01026744042</p>
                </div>
              </div>
            </div>

            {/* ─── SCAN TO CONNECT (4 QR CODES) ─── */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-primary" /> Scan to Connect
                </p>
                <span className="text-[11px] text-foreground/50">Instant Direct Messaging</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "WhatsApp", file: "/images/qr-whatsapp.png", link: "https://wa.me/201026744042" },
                  { name: "LinkedIn", file: "/images/qr-linkedin.png", link: "https://www.linkedin.com/in/abdallah-shehab" },
                  { name: "WeChat", file: "/images/qr-wechat.png", link: "#" },
                  { name: "DingTalk", file: "/images/qr-dingtalk.png", link: "#" },
                ].map((qr, i) => (
                  <div key={i} className="bg-white rounded-2xl p-2.5 shadow-md border border-border/60 text-center space-y-1.5 transition-transform hover:scale-105">
                    <img 
                      src={qr.file} 
                      alt={`${qr.name} QR Code`} 
                      className="w-full aspect-square object-contain rounded-xl"
                    />
                    <p className="text-[10px] font-black tracking-wider text-slate-900 uppercase">{qr.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary flex-1 text-center py-3.5 rounded-xl font-bold text-sm">
                Register as Language Expert
              </Link>
              <Link href="/projects" className="flex-1 text-center py-3.5 rounded-xl font-bold text-sm border border-border bg-card/60 hover:bg-card transition-all text-foreground">
                Browse Active Projects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
