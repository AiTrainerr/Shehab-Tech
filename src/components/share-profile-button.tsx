"use client"

import * as React from "react"
import { Share2, Copy, CheckCircle } from "lucide-react"

export function ShareProfileButton({ userId }: { userId: string }) {
  const [copied, setCopied] = React.useState(false)
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/profile/${userId}` : ""

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out my professional freelancer profile! 🚀\n\n${profileUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <button 
        onClick={handleShareWhatsApp}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] transition-all shadow-lg shadow-[#25D366]/20 flex-1 sm:flex-none"
      >
        <Share2 className="w-5 h-5" /> Share on WhatsApp
      </button>
      <button 
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground font-bold rounded-xl hover:bg-background transition-all flex-1 sm:flex-none"
      >
        {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  )
}
