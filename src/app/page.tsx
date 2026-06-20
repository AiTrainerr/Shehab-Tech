import * as React from "react"
import Link from "next/link"
import { 
  ArrowRight, Users, Briefcase, Award, CheckCircle, 
  Shield, Globe2, Zap, DollarSign, MessageSquare, 
  Search, FileText, Star, Smartphone
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden bg-background">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full text-primary text-sm font-bold tracking-wide animate-fade-in">
              <Zap className="w-4 h-4 fill-primary" /> TRUSTED BY 12,500+ FREELANCERS
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-foreground leading-[1.1]">
              The Hub for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">AI Innovation</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed">
              SHEHAB TECH connects global talent with world-class AI companies. Join our workforce and earn by contributing to high-quality data collection projects.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-5 pt-6">
              <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground text-xl font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 hover:-translate-y-1 active:scale-95">
                Join Now Free
              </Link>
              <Link href="/projects" className="w-full sm:w-auto px-10 py-5 glass text-foreground text-xl font-bold rounded-2xl hover:bg-card/50 transition-all flex items-center justify-center gap-3 border border-border group">
                Browse Projects <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/download" className="w-full sm:w-auto px-10 py-5 bg-foreground text-background text-xl font-bold rounded-2xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 shadow-2xl hover:-translate-y-1 active:scale-95 group">
                <Smartphone className="w-6 h-6" /> Download App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass p-10 md:p-16 rounded-[40px] border border-border shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "Trained Experts", value: "12,500+", icon: Users },
              { label: "Global Languages", value: "100", icon: Globe2 },
              { label: "Accuracy Guaranteed", value: "98%+", icon: Award },
              { label: "Success Rate", value: "99%", icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-3 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-foreground">{stat.value}</div>
                <div className="text-sm font-bold text-foreground/40 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">Your Journey to <span className="text-primary">Success</span></h2>
            <p className="text-xl text-foreground/60">Four simple steps to start earning on the SHEHAB TECH platform.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
            
            {[
              { title: "Register", desc: "Create your free account in seconds.", icon: Smartphone },
              { title: "Verify", desc: "Securely verify your identity with our AI system.", icon: Shield },
              { title: "Apply", desc: "Browse and apply for projects matching your skills.", icon: Search },
              { title: "Get Paid", desc: "Complete tasks and withdraw earnings directly.", icon: Zap },
            ].map((step, i) => (
              <div key={i} className="relative z-10 space-y-6 text-center">
                <div className="w-20 h-20 bg-card border-4 border-background rounded-full shadow-xl flex items-center justify-center mx-auto text-primary font-black text-2xl relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20" />
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-foreground/60 px-4">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-32 bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-foreground">Diverse Range of <span className="text-primary">Opportunities</span></h2>
                <p className="text-xl text-foreground/70 leading-relaxed">We provide a wide array of tasks tailored for different skill sets and regions.</p>
              </div>
              
              <div className="grid gap-6">
                {[
                  { title: "Audio & Voice Recording", desc: "Record natural speech in your native dialect for AI training.", icon: MessageSquare, color: "text-blue-500 bg-blue-500/10" },
                  { title: "Data Annotation", desc: "Help AI see by tagging images and videos accurately.", icon: Search, color: "text-purple-500 bg-purple-500/10" },
                  { title: "Content Moderation", desc: "Ensure digital safety by reviewing platform content.", icon: Shield, color: "text-red-500 bg-red-500/10" },
                  { title: "Translation & Transcription", desc: "Bridge language gaps with high-quality text work.", icon: FileText, color: "text-green-500 bg-green-500/10" },
                ].map((service, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-[32px] hover:bg-background border border-transparent hover:border-border transition-all group">
                    <div className={`p-4 rounded-2xl ${service.color} shrink-0 group-hover:scale-110 transition-transform`}>
                      <service.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                      <p className="text-foreground/60">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square glass rounded-[60px] border border-border shadow-2xl relative overflow-hidden flex items-center justify-center p-12">
                <div className="w-full h-full glass rounded-[40px] border-white/10 p-10 flex flex-col gap-6 shadow-2xl animate-float">
                  <div className="h-4 w-1/3 bg-primary/20 rounded-full" />
                  <div className="h-12 w-full bg-card rounded-2xl" />
                  <div className="h-32 w-full bg-primary/10 rounded-2xl" />
                  <div className="flex gap-4">
                    <div className="h-20 w-1/2 bg-card rounded-2xl" />
                    <div className="h-20 w-1/2 bg-card rounded-2xl" />
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass p-12 md:p-24 rounded-[60px] border border-border text-center space-y-10 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent pointer-events-none" />
            <h2 className="text-4xl md:text-7xl font-black text-foreground">Ready to Build <span className="text-primary">the Future?</span></h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Join the elite circle of AI contributors and start your journey with SHEHAB TECH today. Global opportunities await.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <Link href="/register" className="px-10 py-5 bg-primary text-primary-foreground text-xl font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30">
                Register Now
              </Link>
              <Link href="/#about" className="px-10 py-5 glass text-foreground text-xl font-bold rounded-2xl hover:bg-background transition-all border border-border">
                Learn More
              </Link>
              <Link href="/download" className="px-10 py-5 bg-foreground text-background text-xl font-bold rounded-2xl hover:bg-foreground/90 transition-all flex items-center gap-3">
                <Smartphone className="w-6 h-6" /> Get the App
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
