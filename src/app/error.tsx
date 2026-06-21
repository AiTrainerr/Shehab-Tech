"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global App Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass p-8 md:p-12 rounded-3xl border border-border shadow-2xl max-w-2xl w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black text-foreground">
          Oops! Something went wrong.
        </h1>
        
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl text-left overflow-auto border border-border/50">
          <p className="text-sm font-mono text-red-500 font-bold whitespace-pre-wrap">
            {error.message || "Unknown client-side error"}
          </p>
          {error.stack && (
            <p className="text-xs font-mono text-foreground/50 mt-2 whitespace-pre-wrap mt-4">
              {error.stack.split('\\n').slice(0, 3).join('\\n')}
            </p>
          )}
        </div>

        <p className="text-foreground/70">
          Please take a screenshot of this error and share it with support so we can fix it immediately.
        </p>

        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  )
}
