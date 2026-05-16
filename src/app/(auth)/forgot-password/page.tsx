"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Mail, Key } from "lucide-react"
import { resetPasswordAction } from "@/app/actions/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const result = await resetPasswordAction(formData)
    
    setIsLoading(false)
    if (result.success) {
      setIsSubmitted(true)
    } else {
      setError(result.error || "Failed to reset password")
    }
  }

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-md w-full glass border border-border shadow-2xl rounded-3xl overflow-hidden p-8">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl font-black text-primary">SHEHAB</span>
            <span className="text-2xl font-light text-foreground">TECH</span>
          </Link>
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Reset Password</h2>
          <p className="text-foreground/70 mt-2">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-medium">
              We've sent a password reset link to <br/> <span className="font-bold text-foreground">{email}</span>
            </div>
            <p className="text-sm text-foreground/70">
              Please check your inbox (and spam folder) and click the link to reset your password.
            </p>
            <Link href="/login" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Return to Log In
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input 
                  name="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  placeholder="john@example.com" 
                  required 
                />
              </div>
            </div>

            <button disabled={isLoading} type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50">
              {isLoading ? "Sending Link..." : "Send Reset Link"} {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm font-semibold text-foreground/60 hover:text-primary transition-colors">
            &larr; Back to Log In
          </Link>
        </div>
      </div>
    </div>
  )
}
