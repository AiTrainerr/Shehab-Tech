import Link from "next/link"
import { Shield, Globe2, Mail, Phone, MessageSquare } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl font-black text-primary tracking-tighter">SHEHAB</span>
              <span className="text-3xl font-light text-foreground tracking-tighter">TECH</span>
            </Link>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-xs">
              Leading the global revolution in AI Data Collection and freelance workforce management. Built for precision, security, and scalability.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/30 transition-all">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/30 transition-all">
                <Globe2 className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Platform</h4>
            <ul className="space-y-4">
              {['Browse Projects', 'Success Stories', 'Verify Account', 'Freelancer Guide'].map((item) => (
                <li key={item}>
                  <Link href="/projects" className="text-foreground/50 hover:text-primary transition-colors text-sm font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Legal</h4>
            <ul className="space-y-4">
              {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Security Compliance'].map((item) => (
                <li key={item}>
                  <Link href="/terms" className="text-foreground/50 hover:text-primary transition-colors text-sm font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Connect</h4>
            <div className="space-y-4">
              <a href="mailto:support@shehab-tech.com" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-colors group">
                <div className="p-2 bg-background border border-border rounded-lg group-hover:border-primary/20">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">support@shehab-tech.com</span>
              </a>
              <a href="tel:+201026744042" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-colors group">
                <div className="p-2 bg-background border border-border rounded-lg group-hover:border-primary/20">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">+20 1026 744 042</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} SHEHAB TECH GLOBAL INC. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-green-500/60 uppercase tracking-widest">
              <Shield className="w-3 h-3" /> PCI-DSS COMPLIANT
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-500/60 uppercase tracking-widest">
              <Globe2 className="w-3 h-3" /> GDPR READY
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
