"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  link: string | null
}

interface Props {
  notifications: Notification[]
  unreadCount: number
}

export function MemberDashboardClient({ notifications, unreadCount }: Props) {
  const [showNotifs, setShowNotifs] = React.useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifs(!showNotifs)}
        className="p-2 border border-border rounded-lg bg-card hover:bg-background transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
        )}
      </button>
      {showNotifs && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-foreground/50">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-border hover:bg-background cursor-pointer transition-colors ${!notif.isRead ? "bg-primary/5" : ""}`}
                >
                  <p className="text-sm font-semibold">{notif.title}</p>
                  <p className="text-xs text-foreground/70 mt-1">{notif.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-border bg-background/30">
            <Link
              href="/member/notifications"
              className="block text-center text-sm font-semibold text-primary hover:underline"
              onClick={() => setShowNotifs(false)}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
