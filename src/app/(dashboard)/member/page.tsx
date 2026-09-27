import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { Briefcase, CheckCircle, DollarSign, Star, Bell, Clock, ArrowRight, BookOpen, Shield, BadgeCheck, Trophy, Mic, Lock } from "lucide-react"
import { MemberDashboardClient } from "@/components/member-dashboard-client"
import { getUserLevel, getUserBadges, getLevelProgress, getNextLevel } from "@/lib/gamification"
import { LevelCard } from "@/components/achievement-badge"
import { CopyReferralLink } from "@/components/copy-referral-link"
import { stripHtml } from "@/lib/string-utils"
import { ApplicationStepper } from "@/components/application-stepper"

export const dynamic = 'force-dynamic'

export default async function MemberDashboard() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) redirect("/login")

  const [user, paidApps, recordingStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
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
            status: { in: ["PENDING", "ACCEPTED", "WORKING", "UNDER_REVIEW", "FINAL_REVIEW", "APPROVED", "PAID", "REJECTED"] },
            project: { status: { not: "CANCELLED" } }
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                price: true,
                description: true,
                status: true,
                sentencesPerUser: true,
                scriptType: true,
                isTranscriptionProject: true,
                pricingModel: true,
              }
            }
          },
          orderBy: { updatedAt: "desc" }
        },
      }
    }),
    prisma.application.findMany({
      where: { userId, status: { in: ["APPROVED", "PAID"] } },
      select: { project: { select: { price: true } } }
    }),
    // Fetch recording stats per project for this user
    prisma.voiceRecording.groupBy({
      by: ["userId"],
      where: { userId },
      _count: { id: true }
    }),
  ])

  if (!user) redirect("/api/auth/logout?reason=deleted")

  // Per-project recording stats
  const projectRecordingStats: Record<string, { total: number; accepted: number; rejected: number }> = {}
  for (const app of user.applications) {
    if (!app.project) continue
    const projectId = app.project.id
    const [totalRec, acceptedRec, rejectedRec] = await Promise.all([
      prisma.voiceRecording.count({
        where: { userId, sentence: { projectId } }
      }),
      prisma.voiceRecording.count({
        where: { userId, sentence: { projectId }, status: "ACCEPTED" }
      }),
      prisma.voiceRecording.count({
        where: { userId, sentence: { projectId }, status: { in: ["REJECTED", "NEED_RE_RECORD"] } }
      }),
    ])
    projectRecordingStats[projectId] = { total: totalRec, accepted: acceptedRec, rejected: rejectedRec }
  }

  const unreadCount = user.notifications.filter(n => !n.isRead).length

  const totalEarnings = paidApps.reduce((sum, app) => sum + (app.project?.price ?? 0), 0)

  // Split apps: active vs completed
  const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "WORKING", "UNDER_REVIEW", "FINAL_REVIEW"]
  const DONE_STATUSES = ["APPROVED", "PAID"]
  const activeApps = user.applications.filter(a => ACTIVE_STATUSES.includes(a.status))
  const doneApps = user.applications.filter(a => DONE_STATUSES.includes(a.status))
  const rejectedApps = user.applications.filter(a => a.status === "REJECTED")

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

  function StatusBadge({ status }: { status: string }) {
    const cfg =
      status === "PAID"         ? { cls: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",     label: "💰 Paid" } :
      status === "APPROVED"     ? { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400", label: "✅ Client Approved" } :
      status === "FINAL_REVIEW" ? { cls: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",   label: "🔍 QA2 Review" } :
      status === "UNDER_REVIEW" ? { cls: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",   label: "🔎 QA1 Review" } :
      status === "WORKING"      ? { cls: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",           label: "⚡ In Progress" } :
      status === "ACCEPTED"     ? { cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",   label: "✔ Accepted" } :
      status === "REJECTED"     ? { cls: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",              label: "✗ Rejected" } :
                                  { cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",  label: "⏳ Pending" }
    return (
      <div className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border ${cfg.cls}`}>
        {cfg.label}
      </div>
    )
  }

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
          <p className="text-foreground/70">Here&apos;s everything happening with your projects.</p>
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
            value: activeApps.length.toString(),
            sub: activeApps.length > 0 ? `${activeApps.length} in progress` : "Apply to a project",
            icon: Briefcase,
            color: "green",
            delay: "stagger-2",
          },
          {
            label: "Completed",
            value: doneApps.length.toString(),
            sub: "Approved or paid projects",
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

      {/* Supervisor Link Card */}
      {user.role === "MODERATOR" && (
        <div className="mb-8 glass p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 animate-slide-up stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-foreground">Supervisor Affiliate Link</h2>
          </div>
          <p className="text-sm text-foreground/70 mb-4">
            Share this link with your team. Anyone who registers through this link will automatically be assigned to your team permanently.
          </p>
          <CopyReferralLink userId={user.id} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Projects + Level */}
        <div className="lg:col-span-2 space-y-8">
          {/* Level Card */}
          <LevelCard
            level={level}
            progress={progress}
            completedCount={user.completedCount}
            nextLevel={nextLevel}
          />

          {/* ── ACTIVE PROJECTS ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Active Projects
                {activeApps.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{activeApps.length}</span>
                )}
              </h2>
              <Link href="/member/projects" className="text-sm font-semibold text-primary hover:underline">Browse More</Link>
            </div>

            <div className="space-y-4">
              {activeApps.length === 0 ? (
                <div className="glass p-12 rounded-2xl border border-border text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-foreground/20" />
                  <h3 className="text-lg font-bold text-foreground/50 mb-2">No active projects yet</h3>
                  <p className="text-sm text-foreground/40 mb-6">Browse available projects and apply to start earning.</p>
                  <Link href="/member/projects" className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm">
                    Browse Projects
                  </Link>
                </div>
              ) : (
                activeApps.map((app) => {
                  const stats = projectRecordingStats[app.project?.id || ""]
                  const sentencesTarget = app.project?.sentencesPerUser ?? null
                  const isCompleted = app.project?.status === "COMPLETED"
                  return (
                    <div key={app.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all animate-slide-up">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-lg font-bold truncate">{app.project?.title || "Unknown Project"}</h3>
                            {isCompleted && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-foreground/10 text-foreground/40 rounded-full border border-foreground/10 shrink-0">
                                🔒 Closed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground/60 line-clamp-2">{stripHtml(app.project?.description || "")}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <div className="text-xl font-black text-primary">${app.project?.price?.toFixed(2) ?? "—"}</div>
                          <StatusBadge status={app.status} />
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="mb-4 pt-4 border-t border-border">
                        <ApplicationStepper status={app.status} />
                      </div>

                      {/* Recording Stats (voice projects only) */}
                      {stats && !app.project?.isTranscriptionProject && (stats.total > 0 || sentencesTarget) && (
                        <div className="mb-4 p-3 bg-background/60 rounded-xl border border-border">
                          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Recording Progress</p>
                          <div className="flex items-center gap-4 flex-wrap text-sm">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Mic className="w-3.5 h-3.5 text-primary" />
                              {stats.total}{sentencesTarget ? ` / ${sentencesTarget}` : ""} recorded
                            </span>
                            {stats.accepted > 0 && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> {stats.accepted} accepted
                              </span>
                            )}
                            {stats.rejected > 0 && (
                              <span className="flex items-center gap-1 text-red-500 font-semibold">
                                ⚠ {stats.rejected} need re-record
                              </span>
                            )}
                          </div>
                          {sentencesTarget && stats.total > 0 && (
                            <div className="mt-2 w-full bg-border rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (stats.total / sentencesTarget) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        {isCompleted ? (
                          <span className="text-xs font-bold text-foreground/40 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Recording Closed
                          </span>
                        ) : (app.status === "ACCEPTED" || app.status === "WORKING") ? (
                          <Link href={`/member/projects/${app.project?.id || ""}`} className="flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                            Start Working <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link href={`/member/projects/${app.project?.id || ""}`} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                            View Details <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── COMPLETED PROJECTS ── */}
          {doneApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed Projects
                  <span className="text-xs font-bold px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">{doneApps.length}</span>
                </h2>
              </div>
              <div className="space-y-4">
                {doneApps.map((app) => {
                  const stats = projectRecordingStats[app.project?.id || ""]
                  const sentencesTarget = app.project?.sentencesPerUser ?? null
                  return (
                    <div key={app.id} className={`glass p-6 rounded-2xl border transition-all ${
                      app.status === "PAID" ? "border-green-500/20 bg-green-500/5" : "border-emerald-500/20 bg-emerald-500/5"
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold truncate mb-0.5">{app.project?.title || "Unknown Project"}</h3>
                          <p className="text-sm text-foreground/60 line-clamp-1">{stripHtml(app.project?.description || "")}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <div className="text-xl font-black text-primary">${app.project?.price?.toFixed(2) ?? "—"}</div>
                          <StatusBadge status={app.status} />
                        </div>
                      </div>

                      {/* Compact stats row */}
                      {stats && !app.project?.isTranscriptionProject && stats.total > 0 && (
                        <div className="flex items-center gap-4 flex-wrap text-xs text-foreground/60 mb-3 pt-3 border-t border-border">
                          <span className="flex items-center gap-1">
                            <Mic className="w-3 h-3" />
                            {stats.total}{sentencesTarget ? ` / ${sentencesTarget}` : ""} recorded
                          </span>
                          {stats.accepted > 0 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                              <CheckCircle className="w-3 h-3" /> {stats.accepted} accepted
                            </span>
                          )}
                          {app.status === "PAID" && (
                            <span className="text-green-600 dark:text-green-400 font-bold">
                              💰 Payment released
                            </span>
                          )}
                          {app.status === "APPROVED" && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ✅ Awaiting payment
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Link href={`/member/projects/${app.project?.id || ""}`} className="flex items-center gap-2 text-xs font-bold text-foreground/50 hover:text-primary transition-colors">
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── REJECTED (collapsed) ── */}
          {rejectedApps.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-foreground/50 flex items-center gap-2 mb-3">
                ✗ Rejected Applications
                <span className="text-xs font-bold px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">{rejectedApps.length}</span>
              </h2>
              <div className="space-y-2">
                {rejectedApps.map((app) => (
                  <div key={app.id} className="glass px-4 py-3 rounded-xl border border-red-500/10 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground/50 truncate">{app.project?.title || "Unknown Project"}</p>
                    <Link href={`/member/projects/${app.project?.id || ""}`} className="text-xs text-foreground/40 hover:text-primary transition-colors shrink-0">
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Notifications + Verification + Badges + Quick Links */}
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
                              View ←
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
                <Trophy className="w-5 h-5 text-yellow-500" /> My Badges
              </h3>
              <Link href="/member/achievements" className="text-xs font-bold text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.filter(b => b.earned).slice(0, 4).map(b => (
                <span key={b.id} title={b.description} className="text-2xl cursor-default hover:scale-110 transition-transform inline-block">
                  {b.emoji}
                </span>
              ))}
              {earnedBadgesCount === 0 && (
                <p className="text-xs text-foreground/40">Complete tasks to get your first badge!</p>
              )}
            </div>
            {earnedBadgesCount > 0 && (
              <p className="text-xs text-foreground/50 mt-2">{earnedBadgesCount} earned out of {badges.length} badges</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4">
            <Link href="/member/payments" className="glass p-5 rounded-2xl border border-border hover:border-primary/30 transition-all flex items-center gap-4 group">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500/20 transition-colors">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Payment History</h3>
                <p className="text-sm text-foreground/60">View your earnings history</p>
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
