"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, Globe2, Mail, Phone, Zap, MessageCircle } from "lucide-react"

export function Footer() {
  const pathname = usePathname()
  if (pathname !== "/") return null

  return (
    <footer className="bg-card border-t border-border relative overflow-hidden">
      <div className="absolute top-0 start-0 w-full h-px bg-border" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand & Vision */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="min-h-[44px] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="text-foreground">SHEHAB</span>
                <span className="text-primary font-bold ms-1">TECH</span>
              </span>
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Data Collection & AI Solutions</p>
            <p className="text-sm text-foreground/70 leading-relaxed">
              We provide high-quality multilingual data collection and AI training datasets built for AI labs and technology companies.
            </p>
            <div className="flex gap-2.5 pt-1">
              <a 
                href="https://www.linkedin.com/in/abdallah-shehab" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="LinkedIn - Abdallah Shehab"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-muted flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-primary/10 border border-border/50 transition-all"
              >
                <Globe2 className="w-4 h-4" />
              </a>
              <a 
                href="https://wa.me/201026744042" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="WhatsApp Direct"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-muted flex items-center justify-center text-foreground/70 hover:text-success hover:bg-success/10 border border-border/50 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a 
                href="mailto:info@shehab-tech.com" 
                title="Email Us"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-muted flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-primary/10 border border-border/50 transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-4">Core Services</h4>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li>Long-Form Audio Production</li>
              <li>Audio Transcription & QC</li>
              <li>Multilingual Data Annotation</li>
              <li>AI Training Datasets</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2.5">
              <li><Link href="/projects" className="min-h-[32px] inline-flex items-center text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Browse Projects</Link></li>
              <li><Link href="/register" className="min-h-[32px] inline-flex items-center text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Join as Expert</Link></li>
              <li><Link href="/terms" className="min-h-[32px] inline-flex items-center text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Terms of Service & NDAs</Link></li>
            </ul>
          </div>

          {/* Contact & Leadership */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Direct Contact</h4>
              <p className="text-xs text-foreground/60">Abdallah Shehab · CEO & Founder</p>
            </div>
            <div className="space-y-2.5">
              <a href="mailto:info@shehab-tech.com" className="min-h-[40px] flex items-center gap-3 text-foreground/70 hover:text-primary transition-all text-sm">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>info@shehab-tech.com</span>
              </a>
              <a href="https://wa.me/201026744042" target="_blank" rel="noopener noreferrer" className="min-h-[40px] flex items-center gap-3 text-foreground/70 hover:text-success transition-all text-sm">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span dir="ltr">+20 1026 744 042</span>
              </a>
              <div className="flex items-center gap-3 text-foreground/60 text-xs ps-0.5">
                <span className="font-semibold text-primary">WeChat:</span>
                <span className="font-mono">AS01026744042</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/60 font-medium text-center sm:text-start">
            &copy; 2026 SHEHAB TECH. ALL RIGHTS RESERVED. · COMPANY PROFILE 2026
          </p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <Shield className="w-3.5 h-3.5" /> PCI-DSS COMPLIANT
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Globe2 className="w-3.5 h-3.5" /> GDPR READY
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
