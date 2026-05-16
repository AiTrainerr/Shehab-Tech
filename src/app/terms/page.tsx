import { ArrowLeft, Shield, FileText } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight flex items-center gap-4">
              <FileText className="w-10 h-10 text-primary" /> Terms of Service
            </h1>
            <p className="text-foreground/50 font-medium">Last updated: May 16, 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-foreground/80 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the SHEHAB TECH platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">2. User Verification</h2>
              <p>
                To maintain the integrity of our AI data collection services, all freelancers must undergo a verification process. You agree to provide accurate information, including government-issued identification when requested.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">3. Payment & Earnings</h2>
              <p>
                Earnings are credited to your account upon successful review and approval of submitted tasks. Withdrawal requests are processed within 3-5 business days. We reserve the right to withhold payments if fraudulent activity is detected.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" /> 4. Data Privacy & Confidentiality
              </h2>
              <p>
                Project details, scripts, and instructions are confidential. You agree not to share, distribute, or copy any project-related materials outside the SHEHAB TECH platform.
              </p>
            </section>

            <section className="space-y-4 p-8 glass rounded-3xl border border-border">
              <h2 className="text-xl font-bold text-foreground">Contact Our Legal Team</h2>
              <p className="text-sm">For any questions regarding these terms, please contact us at legal@shehab-tech.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
