"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Mail, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { loginUser } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

function LoginForm() {
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show error from URL params (e.g. after forced logout for deleted account)
  React.useEffect(() => {
    const urlError = searchParams.get("error")
    if (urlError === "account_deleted") {
      setError("This account has been deleted. Please register a new account to continue.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const result = await loginUser(formData)
    
    if (result.success) {
      if (result.role && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(result.role)) {
        router.push("/admin")
      } else {
        router.push("/member")
      }
    } else {
      setError(result.error || "Login failed")
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-semibold">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input name="email" type="email" className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="john@example.com" required />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Password</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input name="password" type={showPassword ? "text" : "password"} className="w-full pl-12 pr-12 py-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="••••••••" required />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button disabled={isLoading} type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50">
        {isLoading ? "Logging in..." : "Log In"} {!isLoading && <ArrowRight className="w-5 h-5" />}
      </button>
    </form>
  )
}

export default function LoginPage() {
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
          <h2 className="text-3xl font-black text-foreground">Welcome Back</h2>
          <p className="text-foreground/70 mt-2">Log in to your dashboard to view new projects</p>
        </div>

        <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <LoginForm />
        </React.Suspense>

        <p className="text-center text-sm text-foreground/60 mt-8">
          Don't have an account yet? <Link href="/register" className="text-primary font-semibold hover:underline">Register Now</Link>
        </p>
      </div>
    </div>
  )
}
