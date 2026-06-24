"use client"

import * as React from "react"
import { logoutUser } from "@/app/actions/logout"

const IDLE_TIMEOUT_MS  = 30 * 60 * 1000  // 30 minutes
const WARN_BEFORE_MS   =  2 * 60 * 1000  //  2 minutes warning

export function SessionTimeout() {
  const [showWarning, setShowWarning] = React.useState(false)
  const [secondsLeft, setSecondsLeft] = React.useState(WARN_BEFORE_MS / 1000)
  const logoutTimer  = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimer    = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimers = React.useCallback(() => {
    if (logoutTimer.current)  clearTimeout(logoutTimer.current)
    if (warnTimer.current)    clearTimeout(warnTimer.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowWarning(false)
    setSecondsLeft(WARN_BEFORE_MS / 1000)

    warnTimer.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(WARN_BEFORE_MS / 1000)
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(countdownRef.current!)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS)

    logoutTimer.current = setTimeout(async () => {
      document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      try { await logoutUser() } catch {}
      window.location.href = "/login?reason=timeout"
    }, IDLE_TIMEOUT_MS)
  }, [])

  React.useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"]
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))
    resetTimers()

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers))
      if (logoutTimer.current)  clearTimeout(logoutTimer.current)
      if (warnTimer.current)    clearTimeout(warnTimer.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [resetTimers])

  if (!showWarning) return null

  const minutes = Math.floor(secondsLeft / 60)
  const secs    = secondsLeft % 60

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center" role="alertdialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div className="relative z-10 glass border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-bounce-in text-center space-y-5">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">⏰</span>
        </div>

        <div>
          <h2 className="text-xl font-black text-foreground mb-2">انتهاء الجلسة قريباً</h2>
          <p className="text-sm text-foreground/60">
            سيتم تسجيل خروجك تلقائياً بعد
          </p>
          <p className="text-3xl font-black text-orange-500 mt-2 tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-1000"
            style={{ width: `${(secondsLeft / (WARN_BEFORE_MS / 1000)) * 100}%` }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetTimers}
            className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            أنا هنا — استمر
          </button>
          <button
            onClick={async () => {
              document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
              document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
              try { await logoutUser() } catch {}
              window.location.href = "/login"
            }}
            className="flex-1 py-3 border border-border text-foreground/70 font-semibold rounded-xl hover:bg-card transition-all"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  )
}
