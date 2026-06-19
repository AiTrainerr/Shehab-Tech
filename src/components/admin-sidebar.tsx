"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, FileText, Activity, AlertCircle, BookOpen, Briefcase, DollarSign, FolderOpen, Award, ShieldCheck, MessageSquare } from "lucide-react"

export function AdminSidebar({ pendingVerifications }: { pendingVerifications: number }) {
  const pathname = usePathname()
  const [role, setRole] = React.useState<string | null>(null)
  const [canReviewQC, setCanReviewQC] = React.useState<boolean>(false)
  const [canApproveApplications, setCanApproveApplications] = React.useState<boolean>(false)

  React.useEffect(() => {
    const cookiesObj = Object.fromEntries(
      document.cookie.split("; ").map((row) => {
        const parts = row.split("=")
        return [parts[0], parts[1]]
      })
    )
    setRole(cookiesObj["userRole"] || null)
    setCanReviewQC(cookiesObj["canReviewQC"] === "true")
    setCanApproveApplications(cookiesObj["canApproveApplications"] === "true")
  }, [])

  const isModerator = role === "MODERATOR"

  const showUsers = !isModerator
  const showApplications = !isModerator || canApproveApplications
  const showQC = !isModerator || canReviewQC

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: Activity, exact: true },
    ...(showUsers ? [{ name: "Users", href: "/admin/users", icon: Users }] : []),
    { name: "Projects", href: "/admin/projects", icon: FolderOpen },
    ...(showApplications ? [{ name: "Applications", href: "/admin/applications", icon: FileText }] : []),
    ...(showQC ? [{ name: "QC Panel", href: "/admin/qc", icon: ShieldCheck }] : []),
    { name: "Comments", href: "/admin/comments", icon: MessageSquare },
  ]

  const managementItems = isModerator ? [] : [
    { name: "Skills", href: "/admin/skills", icon: Award },
    { name: "Verification Requests", href: "/admin/verification", icon: ShieldCheck, badge: pendingVerifications > 0 ? pendingVerifications : null },
    { name: "Learn Skills", href: "/admin/skills", icon: BookOpen },
    { name: "Portfolios", href: "/portfolio", icon: Briefcase },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card hidden lg:block fixed left-0 top-[64px] h-[calc(100vh-64px)] overflow-y-auto z-40">
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

        {managementItems.length > 0 && (
          <>
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
          </>
        )}
      </div>
    </aside>
  )
}
