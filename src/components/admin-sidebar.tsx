"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, FileText, Activity, BookOpen, Briefcase, DollarSign, FolderOpen, Award, ShieldCheck, MessageSquare, BarChart3, Headphones, ChevronDown, ChevronUp } from "lucide-react"
import { DesktopModeToggle } from "./desktop-mode-toggle"

export function AdminSidebar({ 
  pendingVerifications,
  userRole,
  canReviewQC,
  canApproveApplications,
  moderatorType
}: { 
  pendingVerifications: number
  userRole?: string
  canReviewQC?: boolean
  canApproveApplications?: boolean
  moderatorType?: string
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const isModerator = userRole === "MODERATOR"
  const isQA = isModerator && moderatorType === "QA"
  const showApplications = (!isModerator || canApproveApplications) && !isQA
  const showQC = !isModerator || canReviewQC // QA inherently has canReviewQC = true

  const navItems = [
    ...(!isModerator ? [{ name: "Dashboard", href: "/admin", icon: Activity, exact: true }] : []),
    ...(!isModerator ? [{ name: "Users", href: "/admin/users", icon: Users }] : []),
    ...(!isModerator ? [{ name: "Projects", href: "/admin/projects", icon: FolderOpen }] : []),
    ...(showApplications ? [{ name: "Applications", href: "/admin/applications", icon: FileText }] : []),
    ...(showQC ? [{ name: "Audio QC Panel", href: "/admin/qc", icon: ShieldCheck }] : []),
    ...(showQC ? [{ name: "Transcription QA", href: "/admin/transcription", icon: Headphones }] : []),
    ...(!isQA ? [{ name: "Comments", href: "/admin/comments", icon: MessageSquare }] : []),
    { name: "My Profile", href: "/member/profile", icon: BookOpen },
  ]

  const managementItems = isModerator 
    ? (!isQA ? [{ name: "QA Management", href: "/admin/qa-management", icon: ShieldCheck }] : [])
    : [
    { name: "Supervisors", href: "/admin/supervisors", icon: ShieldCheck },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Skills", href: "/admin/skills", icon: Award },
    { name: "Verification Requests", href: "/admin/verification", icon: ShieldCheck, badge: pendingVerifications > 0 ? pendingVerifications : null },
    { name: "Portfolios", href: "/portfolio", icon: Briefcase },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
  ]

  const allItems = [...navItems, ...managementItems]

  // Find current page name for mobile header
  const currentItem = allItems.find(item =>
    "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )

  return (
    <>
      {/* Desktop Sidebar — visible lg+ */}
      <aside className="w-64 border-r border-border bg-card hidden lg:block fixed left-0 top-[64px] h-[calc(100vh-64px)] overflow-y-auto z-40">
        <div className="p-6">
          <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-4">Overview</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
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

        {/* Desktop Mode Toggle at Bottom */}
        <div className="absolute bottom-0 w-full p-6 border-t border-border">
          <DesktopModeToggle />
        </div>
      </aside>

      {/* Mobile Navigation — visible below lg */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl">
        {/* Expanded drawer */}
        {mobileOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-b border-border bg-card">
            <div className="p-4 space-y-1">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Navigation</p>
              {navItems.map((item) => {
                const isActive = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-background"}`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                    {isActive && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                  </Link>
                )
              })}

              {managementItems.length > 0 && (
                <>
                  <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mt-4 mb-2 pt-3 border-t border-border">Management</p>
                  {managementItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-background"}`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs font-bold text-white bg-orange-500 rounded-full px-2 py-0.5">{item.badge}</span>
                        )}
                      </Link>
                    )
                  })}
                </>
              )}
              <div className="p-4 border-t border-border">
                <DesktopModeToggle />
              </div>
            </div>
          </div>
        )}

        {/* Bottom tab bar */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Quick-access: show first 4 nav items as icons */}
          <div className="flex items-center gap-1">
            {allItems.slice(0, 4).map((item) => {
              const isActive = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${isActive ? "text-primary bg-primary/10" : "text-foreground/50 hover:text-foreground"}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[9px] font-semibold">{item.name.split(" ")[0]}</span>
                </Link>
              )
            })}
          </div>

          {/* "More" button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${mobileOpen ? "text-primary bg-primary/10" : "text-foreground/50 hover:text-foreground"}`}
          >
            {mobileOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            <span className="text-[9px] font-semibold">More</span>
          </button>
        </div>
      </div>

      {/* Bottom padding for mobile so content is not hidden behind the tab bar */}
      <div className="lg:hidden h-16 shrink-0" />
    </>
  )
}
