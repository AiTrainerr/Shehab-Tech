import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { Briefcase, CheckCircle, DollarSign, Star, Bell, Clock, ArrowRight, BookOpen, Shield, BadgeCheck, TrendingUp, Trophy } from "lucide-react"
import { MemberDashboardClient } from "@/components/member-dashboard-client"
import { getUserLevel, getUserBadges, getLevelProgress, getNextLevel } from "@/lib/gamification"
import { LevelCard, BadgesGrid } from "@/components/achievement-badge"

export default async function MemberDashboard() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      completedCount: true,
      rating: true,
      verificationStatus: true,
      verificationReason: true,
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, content: true, isRead: true, createdAt: true, link: true }
      },
      applications: {
        where: {
          status: { in: ["PENDING", "ACCEPTED", "WORKING", "UNDER_REVIEW", "FINAL_REVIEW", "APPROVED", "PAID"] },
          project: { status: { not: "CANCELLED" } }
        },
        include: {
          project: {
            select: { id: true, title: true, price: true, description: true }
          }
        },
        orderBy: { updatedAt: "desc" },
        take: 5
      }
    }
  })

  if (!user) redirect("/login")

  const unreadCount = user.notifications.filter(n => !n.isRead).length
  const activeProjects = user.applications.length

  const paidApps = await prisma.application.findMany({
    where: { userId, status: { in: ["APPROVED", "PAID"] } },
    include: { project: { select: { price: true } } }
  })
  const totalEarnings = paidApps.reduce((sum, app) => sum + (app.project?.price || 0), 0)

  // Gamification
  const level    = getUserLevel(user.completedCount)
  const progress = getLevelProgress(user.completedCount)
  const nextLevel = getNextLevel(user.completedCount)
  const badges   = getUserBadges({
    completedCount: user.completedCount,
    rating: user.rating,
    verificationStatus: user.verificationStatus,
  })
  const earnedBadgesCount = badges.filter(b => b.earned).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-slide-up">
        <div>
          <div className="mb-2">
            <span className="text-sm font-bold text-primary uppercase tracking-wider">Freelancer Dashboard</span>
          </div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            Welcome back, {user.firstName}!
            {user.verificationStatus === "VERIFIED" && (
              <BadgeCheck className="w-8 h-8 text-white fill-blue-500" />
            )}
          </h1>
          <p className="text-foreground/70">Here&apos;s what&apos;s happening with your projects today.</p>
          <div className="flex gap-4 mt-2">
            {user.verificationStatus !== "VERIFIED" && (
              <Link href="/member/verification" className="text-xs font-semibold text-orange-500 hover:underline">
                {user.verificationStatus === "PENDING" ? "⏳ Verification under review" :
                 user.verificationStatus === "REJECTED" ? "❌ Verification rejected" :
                 "Not verified yet? Upload documents"}
              </Link>
            )}
            <Link href="/member/profile" className="text-xs font-semibold text-primary hover:underline">View My Profile →</Link>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/member/projects" className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm">
            Find New Projects
          </Link>
          <MemberDashboardClient
            notifications={user.notifications.map(n => ({
              ...n,
              createdAt: n.createdAt.toISOString()
            }))}
            unreadCount={unreadCount}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: "Total Earnings",
            value: `$${totalEarnings.toFixed(2)}`,
            sub: totalEarnings > 0 ? "Approved & Paid payouts" : "Complete tasks to earn",
            icon: DollarSign,
            color: "blue",
            delay: "stagger-1",
          },
          {
            label: "Active Projects",
            value: activeProjects.toString(),
            sub: activeProjects > 0 ? `${activeProjects} in progress` : "Apply to a project",
            icon: Briefcase,
            color: "green",
            delay: "stagger-2",
          },
          {
            label: "Completed",
            value: user.completedCount.toString(),
            sub: "Tasks finished",
            icon: CheckCircle,
            color: "purple",
            delay: "stagger-3",
          },
          {
            label: "Rating",
            value: user.rating > 0 ? user.rating.toFixed(1) : "—",
            sub: user.rating > 0 ? "Based on completed tasks" : "No rating yet",
            icon: Star,
            color: "yellow",
            delay: "stagger-4",
          },
        ].map((stat) => {
          const colorMap: Record<string, string> = {
            blue: "bg-blue-500/10 text-blue-500",
            green: "bg-green-500/10 text-green-500",
            purple: "bg-purple-500/10 text-purple-500",
            yellow: "bg-yellow-500/10 text-yellow-500",
          }
          return (
            <div key={stat.label} className={`glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all animate-slide-up ${stat.delay}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${colorMap[stat.color]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70 font-semibold uppercase">{stat.label}</p>
                  <h3 className="text-2xl font-black animate-count">{stat.value}</h3>
                </div>
              </div>
              <div className="text-sm font-medium text-foreground/60">
                <span className="text-foreground/50">{stat.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Active Projects + Level */}
        <div className="lg:col-span-2 space-y-6">
          {/* Level Card */}
          <LevelCard
            level={level}
            progress={progress}
            completedCount={user.completedCount}
            nextLevel={nextLevel}
          />

          {/* Active Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Current Work</h2>
              <Link href="/member/projects" className="text-sm font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {user.applications.length === 0 ? (
                <div className="glass p-12 rounded-2xl border border-border text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-foreground/20" />
                  <h3 className="text-lg font-bold text-foreground/50 mb-2">No active projects yet</h3>
                  <p className="text-sm text-foreground/40 mb-6">Browse available projects and apply to start earning.</p>
                  <Link href="/member/projects" className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm">
                    Browse Projects
                  </Link>
                </div>
              ) : (
                user.applications.map((app) => (
                  <div key={app.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all animate-slide-up">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1">{app.project.title}</h3>
                        <p className="text-sm text-foreground/70 line-clamp-2">{app.project.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-primary">${app.project.price?.toFixed(2) ?? "—"}</div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-md inline-block mt-1 ${
                          app.status === "APPROVED" || app.status === "PAID" ? "bg-green-500/10 text-green-500" :
                          app.status === "WORKING" || app.status === "ACCEPTED" ? "bg-yellow-500/10 text-yellow-500" :
                          app.status === "FINAL_REVIEW" ? "bg-purple-500/10 text-purple-500" :
                          app.status === "PENDING" ? "bg-blue-500/10 text-blue-500" :
                          "bg-orange-500/10 text-orange-500"
                        }`}>
                          {app.status === "APPROVED" ? "Approved" :
                           app.status === "PAID" ? "Paid (تم الدفع)" :
                           app.status === "FINAL_REVIEW" ? "Final Client Review" :
                           app.status === "WORKING" ? "In Progress" :
                           app.status === "ACCEPTED" ? "Accepted (تمت الموافقة)" :
                           app.status === "PENDING" ? "Pending (قيد الانتظار)" : "Under Review"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                      {app.status === "ACCEPTED" || app.status === "WORKING" ? (
                        <Link href={`/member/projects/${app.project.id}`} className="flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                          ابدأ التسجيل الآن <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link href={`/member/projects/${app.project.id}`} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                          View Details <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Notifications + Badges + Quick Links */}
        <div className="space-y-6">
          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
            </div>
            <div className="glass p-6 rounded-2xl border border-border">
              <div className="space-y-6">
                {user.notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-10 h-10 mx-auto mb-3 text-foreground/20" />
                    <p className="text-sm text-foreground/50 font-semibold">No notifications yet</p>
                    <p className="text-xs text-foreground/40 mt-1">You&apos;ll get notified about project updates here.</p>
                  </div>
                ) : (
                  user.notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-4">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 border-2 ${notif.isRead ? "bg-foreground/20 border-foreground/20" : "bg-primary border-primary badge-pulse"}`} />
                      <div>
                        <h4 className="text-sm font-bold">{notif.title}</h4>
                        <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{notif.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                            {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {notif.link && (
                            <Link href={notif.link} className="text-[10px] text-primary font-bold hover:underline">
                              عرض ←
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link href="/member/notifications" className="block text-center w-full mt-6 py-3 border border-border rounded-xl text-sm font-semibold hover:bg-background transition-colors">
                View All Notifications
              </Link>
            </div>
          </div>

          {/* Verification Warning */}
          {user.verificationStatus !== "VERIFIED" && user.verificationStatus !== "PENDING" && (
            <div className={`glass p-6 rounded-2xl border ${user.verificationStatus === "REJECTED" ? "border-red-500/30 bg-red-500/5" : "border-orange-500/30 bg-orange-500/5"}`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-6 h-6 shrink-0 mt-0.5 ${user.verificationStatus === "REJECTED" ? "text-red-500" : "text-orange-500"}`} />
                <div>
                  <h3 className={`font-bold mb-1 ${user.verificationStatus === "REJECTED" ? "text-red-500" : "text-orange-500"}`}>
                    {user.verificationStatus === "REJECTED" ? "Verification Rejected" : "Verify your identity"}
                  </h3>
                  {user.verificationStatus === "REJECTED" && user.verificationReason && (
                    <p className="text-xs text-red-500/80 mb-2 font-medium">Reason: {user.verificationReason}</p>
                  )}
                  <p className="text-sm text-foreground/60 mb-3">
                    {user.verificationStatus === "REJECTED" ? "Please re-upload clear, valid ID documents." : "Upload your ID and selfie to unlock all features."}
                  </p>
                  <Link href="/member/verification" className={`text-sm font-bold hover:underline ${user.verificationStatus === "REJECTED" ? "text-red-500" : "text-orange-500"}`}>
                    Verify Now →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Badges Summary */}
          <div className="glass p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> شاراتي
              </h3>
              <Link href="/member/achievements" className="text-xs font-bold text-primary hover:underline">
                عرض الكل
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.filter(b => b.earned).slice(0, 4).map(b => (
                <span key={b.id} title={b.description} className="text-2xl cursor-default hover:scale-110 transition-transform inline-block">
                  {b.emoji}
                </span>
              ))}
              {earnedBadgesCount === 0 && (
                <p className="text-xs text-foreground/40">أكمل مهامك لتحصل على أول شارة!</p>
              )}
            </div>
            {earnedBadgesCount > 0 && (
              <p className="text-xs text-foreground/50 mt-2">{earnedBadgesCount} شارة مكتسبة من {badges.length}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4">
            <Link href="/member/payments" className="glass p-5 rounded-2xl border border-border hover:border-primary/30 transition-all flex items-center gap-4 group">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500/20 transition-colors">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">سجل المدفوعات</h3>
                <p className="text-sm text-foreground/60">عرض تاريخ أرباحك</p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground/30 ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
            <Link href="/member/learn" className="glass p-5 rounded-2xl border border-border hover:border-primary/30 transition-all flex items-center gap-4 group">
              <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Learn Skills</h3>
                <p className="text-sm text-foreground/60">Browse curated learning resources</p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground/30 ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
