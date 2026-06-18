"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, FileText, Activity, AlertCircle, BookOpen, Briefcase, DollarSign } from "lucide-react"

export function AdminSidebar({ pendingVerifications }: { pendingVerifications: number }) {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: Activity, exact: true },
    { name: "Users & Freelancers", href: "/admin/users", icon: Users },
    { name: "Projects", href: "/admin/projects", icon: FileText },
  ]

  const managementItems = [
    { name: "Verification Requests", href: "/admin/verification", icon: AlertCircle, badge: pendingVerifications > 0 ? pendingVerifications : null },
    { name: "Learn Skills", href: "/admin/skills", icon: BookOpen },
    { name: "Portfolios", href: "/portfolio", icon: Briefcase },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0">
      <div className="p-6">
        <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-4">Overview</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-background"}`}>
                <item.icon className="w-5 h-5" /> {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-4 mt-8">Management</div>
        <nav className="space-y-1">
          {managementItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-background"}`}>
                <item.icon className="w-5 h-5" /> {item.name}
                {item.badge && (
                  <span className="ml-auto text-xs font-bold text-white bg-orange-500 rounded-full px-2 py-0.5">{item.badge}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
