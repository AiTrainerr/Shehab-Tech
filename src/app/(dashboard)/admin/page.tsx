import * as React from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Users, FileText, Activity, AlertCircle, Plus, BookOpen, Briefcase, DollarSign } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalUsers, totalProjects, pendingVerifications, openProjects] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.user.count({ where: { verificationStatus: "PENDING" } }),
    prisma.project.count({ where: { status: "OPEN" } }),
  ])

  const recentVerifications = await prisma.user.findMany({
    where: { verificationStatus: "PENDING" },
    select: { id: true, firstName: true, lastName: true, email: true, idCardUrl: true, selfieUrl: true },
    take: 4,
    orderBy: { updatedAt: "desc" }
  })

  const recentProjects = await prisma.project.findMany({
    select: {
      id: true, title: true, status: true,
      _count: { select: { applications: true } }
    },
    take: 4,
    orderBy: { createdAt: "desc" }
  })

  return (
    <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground">Admin Overview</h1>
            <p className="text-foreground/70">Real-time platform statistics and management tools.</p>
          </div>
          <Link href="/admin/projects/create" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm">
            <Plus className="w-5 h-5" /> Create Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Members", value: totalUsers.toLocaleString(), icon: <Users className="w-6 h-6" />, color: "text-blue-500 bg-blue-500/10" },
            { label: "Total Projects", value: totalProjects.toLocaleString(), icon: <FileText className="w-6 h-6" />, color: "text-green-500 bg-green-500/10" },
            { label: "Pending Verifications", value: pendingVerifications.toLocaleString(), icon: <AlertCircle className="w-6 h-6" />, color: "text-orange-500 bg-orange-500/10" },
            { label: "Open Projects", value: openProjects.toLocaleString(), icon: <Activity className="w-6 h-6" />, color: "text-primary bg-primary/10" },
          ].map((stat, i) => (
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Verifications */}
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

          {/* Recent Projects */}
          <div className="glass p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Recent Projects</h2>
              <Link href="/admin/projects" className="text-sm font-semibold text-primary hover:underline">Manage</Link>
            </div>
            
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 text-foreground/40">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No projects yet</p>
                  <Link href="/admin/projects/create" className="text-sm text-primary hover:underline mt-2 inline-block">Create your first project →</Link>
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
