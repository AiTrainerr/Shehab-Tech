"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, Globe2, Mail, Phone, Zap } from "lucide-react"

export function Footer() {
  const pathname = usePathname()
  if (pathname !== "/") return null

  return (
    <footer className="bg-card border-t border-border relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="text-xl font-black tracking-tight"><span className="text-foreground">SHEHAB</span><span className="text-foreground/50 font-light">TECH</span></span>
            </Link>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-xs">
              The premier platform for AI training data collection and freelance talent. Built with precision, security, and integrity.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground/50 hover:text-primary hover:bg-primary/10 transition-all">
                <Globe2 className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/company/shehab-teck/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground/50 hover:text-primary hover:bg-primary/10 transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-5">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/projects" className="text-sm text-foreground/60 hover:text-primary transition-colors font-medium">Browse Available Tasks</Link></li>
              <li><Link href="/terms" className="text-sm text-foreground/60 hover:text-primary transition-colors font-medium">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="space-y-5">
            <h4 className="text-sm font-bold text-foreground">Get In Touch</h4>
            <div className="space-y-3">
              <a href="mailto:info@shehab-tech.com" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-all group">
                <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-all shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">info@shehab-tech.com</span>
              </a>
              <a href="tel:+201026744042" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-all group">
                <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-all shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">+20 1026 744 042</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/50 font-medium">
            &copy; {new Date().getFullYear()} SHEHAB TECH GLOBAL. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
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
