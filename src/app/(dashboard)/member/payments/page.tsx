import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DollarSign, CheckCircle, Clock, TrendingUp, Wallet } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MemberPaymentsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const applications = await prisma.application.findMany({
    where: {
      userId,
      status: { in: ["APPROVED", "PAID", "WORKING", "UNDER_REVIEW", "FINAL_REVIEW"] }
    },
    include: {
      project: { select: { id: true, title: true, price: true } }
    },
    orderBy: { updatedAt: "desc" }
  })

  const paid    = applications.filter(a => a.status === "PAID")
  const pending = applications.filter(a => a.status === "APPROVED")
  const inProgress = applications.filter(a => ["WORKING", "UNDER_REVIEW", "FINAL_REVIEW"].includes(a.status))

  const totalEarned  = paid.reduce((s, a)    => s + (a.project?.price || 0), 0)
  const totalPending = pending.reduce((s, a) => s + (a.project?.price || 0), 0)

  const statusLabel: Record<string, string> = {
    PAID: "Paid",
    APPROVED: "Awaiting Payout",
    WORKING: "In Progress",
    UNDER_REVIEW: "Under Review",
    FINAL_REVIEW: "Final Client Review",
  }

  const statusColor: Record<string, string> = {
    PAID: "bg-green-500/10 text-green-500",
    APPROVED: "bg-yellow-500/10 text-yellow-500",
    WORKING: "bg-blue-500/10 text-blue-500",
    UNDER_REVIEW: "bg-orange-500/10 text-orange-500",
    FINAL_REVIEW: "bg-purple-500/10 text-purple-500",
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <span className="text-sm font-bold text-primary uppercase tracking-wider">Finance</span>
        <h1 className="text-3xl font-black text-foreground mt-1 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-green-500" />
          Payment History
        </h1>
        <p className="text-foreground/60 mt-1">Track your earnings and payout statuses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up stagger-1">
        {[
          {
            label: "Total Earnings",
            value: `$${totalEarned.toFixed(2)}`,
            sub: `${paid.length} paid projects`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-500/10",
          },
          {
            label: "Pending Payout",
            value: `$${totalPending.toFixed(2)}`,
            sub: `${pending.length} approved projects`,
            icon: Clock,
            color: "text-yellow-500 bg-yellow-500/10",
          },
          {
            label: "In Progress",
            value: inProgress.length.toString(),
            sub: "active projects",
            icon: DollarSign,
            color: "text-blue-500 bg-blue-500/10",
          },
        ].map(stat => (
          <div key={stat.label} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-foreground/60 font-semibold">{stat.label}</p>
                <h3 className="text-2xl font-black">{stat.value}</h3>
              </div>
            </div>
            <p className="text-xs text-foreground/40">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden animate-slide-up stagger-2">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold">Transaction History</h2>
        </div>
        {applications.length === 0 ? (
          <div className="p-16 text-center">
            <DollarSign className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground/40 mb-2">No transactions yet</h3>
            <p className="text-sm text-foreground/30">Complete your projects to see them here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="text-right px-6 py-3 font-bold text-foreground/50 text-xs uppercase tracking-wider">Project</th>
                  <th className="text-right px-6 py-3 font-bold text-foreground/50 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-right px-6 py-3 font-bold text-foreground/50 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 font-bold text-foreground/50 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app, i) => (
                  <tr
                    key={app.id}
                    className="hover:bg-card/30 transition-colors animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{app.project?.title || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">${(app.project?.price || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor[app.status] || "bg-border text-foreground"}`}>
                        {app.status === "PAID" && <CheckCircle className="w-3 h-3" />}
                        {statusLabel[app.status] || app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground/50 text-xs">
                      {new Date(app.updatedAt).toLocaleDateString("en-GB", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
