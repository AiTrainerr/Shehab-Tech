import * as React from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Users, FileText, Activity, AlertCircle, Plus, BookOpen, Briefcase, DollarSign, MessageSquare, Shield } from "lucide-react"
import { CopyReferralLink } from "@/components/copy-referral-link"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, assignedProjectId: true }
  })

  const isModerator = currentUser?.role === "MODERATOR"
  const assignedProjectId = currentUser?.assignedProjectId || "none"

  let totalUsers = 0
  let totalProjects = 0
  let pendingVerifications = 0
  let openProjects = 0
  let recentVerifications: any[] = []
  let recentProjects: any[] = []
  let activeProjectsList: { id: string; title: string }[] = []
  let currentModeratorsList: any[] = []

  if (isModerator) {
    const [modProjCount, modUsersCount, modProject] = await Promise.all([
      prisma.project.count({ where: { id: assignedProjectId } }),
      prisma.application.count({ where: { projectId: assignedProjectId } }),
      prisma.project.findUnique({
        where: { id: assignedProjectId },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { applications: true } }
        }
      })
    ])

    totalProjects = modProjCount
    totalUsers = modUsersCount
    recentProjects = modProject ? [modProject] : []
  } else {
    const [allUsers, allProjects, allPendingVerifs, allOpenProjects, allActiveProjects, modsList, reviewedCounts] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.user.count({ where: { verificationStatus: "PENDING" } }),
      prisma.project.count({ where: { status: "OPEN" } }),
      prisma.project.findMany({
        select: { id: true, title: true }
      }),
      prisma.user.findMany({
        where: { role: "MODERATOR" },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true, 
          isApproved: true, 
          assignedProjectId: true,
          canReviewQC: true,
          canApproveApplications: true,
          _count: { select: { comments: true, teamMembers: true } }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.voiceRecording.groupBy({
        by: ['reviewedBy'],
        where: { reviewedBy: { not: null } },
        _count: { _all: true }
      })
    ])

    const reviewedMap = Object.fromEntries(
      reviewedCounts
        .filter((item): item is typeof item & { reviewedBy: string } => !!item.reviewedBy)
        .map(item => [item.reviewedBy, item._count._all])
    )

    currentModeratorsList = modsList.map(mod => {
      const modName = `${mod.firstName} ${mod.lastName}`
      return {
        ...mod,
        reviewedCount: reviewedMap[modName] || 0
      }
    })

    totalUsers = allUsers
    totalProjects = allProjects
    pendingVerifications = allPendingVerifs
    openProjects = allOpenProjects
    activeProjectsList = allActiveProjects
    // We will pass currentModeratorsList to the UI

    recentVerifications = await prisma.user.findMany({
      where: { verificationStatus: "PENDING" },
      select: { id: true, firstName: true, lastName: true, email: true, idCardUrl: true, selfieUrl: true },
      take: 4,
      orderBy: { updatedAt: "desc" }
    })

    recentProjects = await prisma.project.findMany({
      select: {
        id: true, title: true, status: true,
        _count: { select: { applications: true } }
      },
      take: 4,
      orderBy: { createdAt: "desc" }
    })
  }

  const stats = isModerator
    ? [
        { label: "Project Applicants", value: totalUsers.toLocaleString(), icon: <Users className="w-6 h-6" />, color: "text-blue-500 bg-blue-500/10" },
        { label: "Assigned Projects", value: totalProjects.toLocaleString(), icon: <FileText className="w-6 h-6" />, color: "text-green-500 bg-green-500/10" },
      ]
    : [
        { label: "Total Members", value: totalUsers.toLocaleString(), icon: <Users className="w-6 h-6" />, color: "text-blue-500 bg-blue-500/10" },
        { label: "Total Projects", value: totalProjects.toLocaleString(), icon: <FileText className="w-6 h-6" />, color: "text-green-500 bg-green-500/10" },
        { label: "Pending Verifications", value: pendingVerifications.toLocaleString(), icon: <AlertCircle className="w-6 h-6" />, color: "text-orange-500 bg-orange-500/10" },
        { label: "Open Projects", value: openProjects.toLocaleString(), icon: <Activity className="w-6 h-6" />, color: "text-primary bg-primary/10" },
      ]

  return (
    <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground">Admin Overview</h1>
            <p className="text-foreground/70">Real-time platform statistics and management tools.</p>
          </div>
          {!isModerator && (
            <Link href="/admin/projects/create" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm">
              <Plus className="w-5 h-5" /> Create Project
            </Link>
          )}
        </div>

        {/* Supervisor Affiliate Link */}
        {isModerator && (
          <div className="mb-8 glass p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-foreground">Supervisor Affiliate Link</h2>
            </div>
            <p className="text-sm text-foreground/70 mb-4">
              Share this link with your team. Anyone who registers through this link will automatically be assigned to your team permanently.
            </p>
            <CopyReferralLink userId={userId} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-border">
              <div className="flex items-center gap-4 mb-2">
                <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-sm text-foreground/70 font-semibold">{stat.label}</p>
                  <h3 className="text-3xl font-black">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audio Platform Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/qc" className="glass p-6 rounded-2xl border border-border hover:border-primary/50 transition-all flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Quality Control (QC)</h3>
              <p className="text-xs text-foreground/60 mt-1">Review pending voice recordings, approve, reject, or request re-recordings.</p>
            </div>
            <Activity className="w-8 h-8 text-primary group-hover:scale-110 transition-all shrink-0 ml-2" />
          </Link>

          <Link href="/admin/comments" className="glass p-6 rounded-2xl border border-border hover:border-primary/50 transition-all flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Comments Management</h3>
              <p className="text-xs text-foreground/60 mt-1">Moderate project comments, view freelancer feedback, and post replies.</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary group-hover:scale-110 transition-all shrink-0 ml-2" />
          </Link>

          {!isModerator && (
            <Link href="/admin/storage" className="glass p-6 rounded-2xl border border-border hover:border-primary/50 transition-all flex items-center justify-between group">
              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Storage & Audit Logs</h3>
                <p className="text-xs text-foreground/60 mt-1">Monitor remaining storage space, run cleanups, and view audit history.</p>
              </div>
              <FileText className="w-8 h-8 text-primary group-hover:scale-110 transition-all shrink-0 ml-2" />
            </Link>
          )}
        </div>

        {/* Supervisors link moved to sidebar */}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Verifications */}
          {!isModerator && (
            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Pending Verifications</h2>
                <Link href="/admin/verification" className="text-sm font-semibold text-primary hover:underline">View All</Link>
              </div>
              
              <div className="space-y-4">
                {recentVerifications.length === 0 ? (
                  <div className="text-center py-8 text-foreground/40">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No pending verifications</p>
                  </div>
                ) : (
                  recentVerifications.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{user.firstName} {user.lastName}</h4>
                          <p className="text-xs text-foreground/60">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/admin/verification" className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded hover:bg-primary/20 transition-colors">
                        Review
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className={isModerator ? "lg:col-span-2 glass p-6 rounded-2xl border border-border" : "glass p-6 rounded-2xl border border-border"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Recent Projects</h2>
              <Link href="/admin/projects" className="text-sm font-semibold text-primary hover:underline">Manage</Link>
            </div>
            
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 text-foreground/40">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No projects yet</p>
                  {!isModerator && (
                    <Link href="/admin/projects/create" className="text-sm text-primary hover:underline mt-2 inline-block">Create your first project →</Link>
                  )}
                </div>
              ) : (
                recentProjects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-background rounded-xl border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-sm truncate flex-1 mr-2">{proj.title}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${proj.status === "OPEN" ? "text-green-500 bg-green-500/10" : proj.status === "IN_PROGRESS" ? "text-yellow-500 bg-yellow-500/10" : "text-foreground/50 bg-foreground/5"}`}>
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60">{proj._count.applications} applicants</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
    </main>
  )
}
