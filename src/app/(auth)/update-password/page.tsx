"use client"

import * as React from "react"
import Link from "next/link"
import { Key, ArrowRight } from "lucide-react"
import { updatePasswordAction } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

export default function UpdatePasswordPage() {
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const result = await updatePasswordAction(formData)
    
    setIsLoading(false)
    if (result.success) {
      alert("Password updated successfully! Redirecting...")
      router.push("/member")
    } else {
      setError(result.error || "Failed to update password")
    }
  }

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center p-4 relative overflow-hidden">
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
          <h2 className="text-2xl font-black text-foreground">Set New Password</h2>
          <p className="text-foreground/70 mt-2">Enter your new secure password below.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold">New Password</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                name="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                placeholder="••••••••" 
                required 
                minLength={6}
              />
            </div>
          </div>

          <button disabled={isLoading} type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50">
            {isLoading ? "Updating..." : "Update Password"} {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
