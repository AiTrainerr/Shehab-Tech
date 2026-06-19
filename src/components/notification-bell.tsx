"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, X, CheckCheck, BellRing } from "lucide-react"

type Notification = {
  id: string
  title: string
  content: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

// Generate a short notification beep using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    const playTone = (freq: number, start: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = "sine"
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration + 0.05)
    }
    
    playTone(880, 0,    0.12, 0.3)
    playTone(1046, 0.13, 0.12, 0.3)
    playTone(1318, 0.26, 0.18, 0.25)
  } catch (e) {
    // Audio not supported – silent fallback
  }
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [animate, setAnimate] = React.useState(false)
  const prevCountRef = React.useRef<number>(0)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`, { cache: "no-store" })
      if (!res.ok) return
      const data: Notification[] = await res.json()
      
      const newUnread = data.filter(n => !n.isRead).length
      const prevUnread = prevCountRef.current

      if (prevUnread !== undefined && newUnread > prevUnread) {
        // New notification arrived!
        playNotificationSound()
        setAnimate(true)
        setTimeout(() => setAnimate(false), 1500)
      }

      prevCountRef.current = newUnread
      setNotifications(data)
    } catch (e) {
      // silently fail
    }
  }, [userId])

  // Poll every 30 seconds
  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markAllRead = async () => {
    setLoading(true)
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      prevCountRef.current = 0
    } catch (e) {}
    setLoading(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unreadCount > 0) markAllRead() }}
        className={`relative p-2 rounded-xl hover:bg-card transition-all ${animate ? "text-primary" : "text-foreground/70"}`}
        title="Notifications"
      >
        {animate ? (
          <BellRing className="w-5 h-5 animate-bounce text-primary" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-primary font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-background transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <li className="p-8 text-center text-foreground/50">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No notifications yet</p>
              </li>
            ) : (
              notifications.slice(0, 15).map(n => (
                <li key={n.id} className={`transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-card/80 transition-colors">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? "bg-primary" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{n.title}</p>
                        <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{n.content}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">
                          {new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex gap-3 px-4 py-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? "bg-primary" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{n.title}</p>
                        <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{n.content}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">
                          {new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-background/50">
              <Link
                href="/member/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-primary hover:underline w-full text-center block"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
