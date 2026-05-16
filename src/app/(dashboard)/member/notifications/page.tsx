"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Bell, CheckCircle, Star, DollarSign } from "lucide-react"

export default function NotificationsPage() {
  const notifications = [
    { title: "Task Approved", desc: "Your submission for Image Annotation was approved. Great work!", time: "2 hours ago", type: "success" },
    { title: "Payment Processed", desc: "$200.00 has been sent to your PayPal account. It may take 2-3 business days to appear.", time: "1 day ago", type: "payment" },
    { title: "New Match", desc: "A new Translation project matches your skills. Check it out now before it gets filled.", time: "2 days ago", type: "project" },
    { title: "Welcome to Shehab Tech!", desc: "We are glad to have you on board. Please complete your profile to start earning.", time: "1 week ago", type: "system" },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />
      case "payment": return <DollarSign className="w-5 h-5 text-blue-500" />
      case "project": return <Star className="w-5 h-5 text-primary" />
      default: return <Bell className="w-5 h-5 text-foreground/50" />
    }
  }

  const getBg = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/10 border-green-500/20"
      case "payment": return "bg-blue-500/10 border-blue-500/20"
      case "project": return "bg-primary/10 border-primary/20"
      default: return "bg-card border-border"
    }
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
          </div>
          <button className="text-sm font-semibold text-primary hover:underline">
            Mark all as read
          </button>
        </div>

        <div className="space-y-4">
          {notifications.map((notif, i) => (
            <div key={i} className={`glass p-6 rounded-2xl border ${getBg(notif.type)} flex gap-6 hover:shadow-lg transition-all`}>
              <div className="shrink-0 mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold">{notif.title}</h3>
                  <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider whitespace-nowrap">
                    {notif.time}
                  </span>
                </div>
                <p className="text-foreground/70">{notif.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
