"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"

export function CopyReferralLink({ userId }: { userId: string }) {
  const [copied, setCopied] = React.useState(false)
  const [origin, setOrigin] = React.useState("https://shehab-tech.com")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const referralUrl = `${origin}/register?team=${userId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <input 
        type="text" 
        readOnly 
        value={referralUrl}
        className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground outline-none font-mono"
      />
      <button
        onClick={handleCopy}
        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors border border-primary/20"
        title="Copy Link"
      >
        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>
  )
}
