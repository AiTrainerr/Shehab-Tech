import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Bell, CheckCircle, Star, DollarSign, Briefcase } from "lucide-react"
import { markAllNotificationsRead } from "@/app/actions/notifications"

export default async function NotificationsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })

  const getIcon = (title: string) => {
    const t = title.toLowerCase()
    if (t.includes("payment") || t.includes("earn")) return <DollarSign className="w-5 h-5 text-blue-500" />
    if (t.includes("approv") || t.includes("accept") || t.includes("verif")) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (t.includes("project") || t.includes("match") || t.includes("new")) return <Briefcase className="w-5 h-5 text-primary" />
    return <Bell className="w-5 h-5 text-foreground/50" />
  }

  const getBg = (title: string, isRead: boolean) => {
    if (!isRead) {
      const t = title.toLowerCase()
      if (t.includes("payment") || t.includes("earn")) return "bg-blue-500/5 border-blue-500/20"
      if (t.includes("approv") || t.includes("accept") || t.includes("verif")) return "bg-green-500/5 border-green-500/20"
      return "bg-primary/5 border-primary/20"
    }
    return "bg-card border-border"
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/member" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" /> All Notifications
            </h1>
            <p className="text-foreground/60 mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <form action={markAllNotificationsRead}>
              <input type="hidden" name="userId" value={userId} />
              <button type="submit" className="text-sm font-semibold text-primary hover:underline">
                Mark all as read
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="glass p-16 rounded-2xl border border-border text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-foreground/20" />
              <h3 className="text-xl font-bold text-foreground/40 mb-2">No notifications yet</h3>
              <p className="text-foreground/30">You'll see project updates and announcements here.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`glass p-6 rounded-2xl border ${getBg(notif.title, notif.isRead)} flex gap-6 hover:shadow-lg transition-all`}>
                <div className="shrink-0 mt-1">
                  {getIcon(notif.title)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {notif.title}
                      {!notif.isRead && <span className="w-2 h-2 bg-primary rounded-full inline-block" />}
                    </h3>
                    <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-foreground/70">{notif.content}</p>
                  {notif.link && (
                    <Link href={notif.link} className="text-sm font-bold text-primary hover:underline mt-2 inline-block">
                      View →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
