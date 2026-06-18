import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { Briefcase, CheckCircle, DollarSign, Star, Bell, Clock, ArrowRight, BookOpen, Shield } from "lucide-react"
import { MemberDashboardClient } from "@/components/member-dashboard-client"

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
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, content: true, isRead: true, createdAt: true, link: true }
      },
      applications: {
        where: { status: { in: ["ACCEPTED", "WORKING", "UNDER_REVIEW"] } },
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            Welcome back, {user.firstName}!
            {user.verificationStatus === "VERIFIED" && (
              <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500/20" />
            )}
          </h1>
          <p className="text-foreground/70">Here's what's happening with your projects today.</p>
          <div className="flex gap-4 mt-2">
            {user.verificationStatus !== "VERIFIED" && (
              <Link href="/member/verification" className="text-xs font-semibold text-orange-500 hover:underline">
                {user.verificationStatus === "PENDING" ? "⏳ Verification under review" : "Not verified yet? Upload documents"}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Total Earnings</p>
              <h3 className="text-2xl font-black">$0.00</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-foreground/50">Complete tasks to earn</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Active Projects</p>
              <h3 className="text-2xl font-black">{activeProjects}</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-green-500">{activeProjects > 0 ? `${activeProjects} in progress` : "Apply to a project"}</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Completed</p>
              <h3 className="text-2xl font-black">{user.completedCount}</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-foreground/70">Tasks finished</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Rating</p>
              <h3 className="text-2xl font-black">{user.rating > 0 ? user.rating.toFixed(1) : "—"}</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-foreground/70">{user.rating > 0 ? "Based on completed tasks" : "No rating yet"}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
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
                <div key={app.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold mb-1">{app.project.title}</h3>
                      <p className="text-sm text-foreground/70 line-clamp-2">{app.project.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary">${app.project.price?.toFixed(2) ?? "—"}</div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-md inline-block mt-1 ${
                        app.status === "ACCEPTED" ? "bg-blue-500/10 text-blue-500" :
                        app.status === "WORKING" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-orange-500/10 text-orange-500"
                      }`}>
                        {app.status === "ACCEPTED" ? "Accepted" : app.status === "WORKING" ? "In Progress" : "Under Review"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <Link href={`/member/projects/${app.project.id}`} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                      View Project <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications / Side Panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-border">
            <div className="space-y-6">
              {user.notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-foreground/20" />
                  <p className="text-sm text-foreground/50 font-semibold">No notifications yet</p>
                  <p className="text-xs text-foreground/40 mt-1">You'll get notified about project updates here.</p>
                </div>
              ) : (
                user.notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-4">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 border-2 ${notif.isRead ? "bg-foreground/20 border-foreground/20" : "bg-primary border-primary"}`} />
                    <div>
                      <h4 className="text-sm font-bold">{notif.title}</h4>
                      <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{notif.content}</p>
                      <span className="text-[10px] text-foreground/50 mt-2 block font-medium uppercase tracking-wider">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <Link href="/member/notifications" className="block text-center w-full mt-6 py-3 border border-border rounded-xl text-sm font-semibold hover:bg-background transition-colors">
              View All Notifications
            </Link>
          </div>

          {/* Verification prompt if not verified */}
          {user.verificationStatus === "NOT_VERIFIED" && (
            <div className="glass p-6 rounded-2xl border border-orange-500/30 bg-orange-500/5">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-orange-500 mb-1">Verify your identity</h3>
                  <p className="text-sm text-foreground/60 mb-3">Upload your ID and selfie to unlock all features.</p>
                  <Link href="/member/verification" className="text-sm font-bold text-orange-500 hover:underline">Verify Now →</Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4">
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
