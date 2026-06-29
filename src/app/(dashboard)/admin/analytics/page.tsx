import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { UsersGrowthChart, ProjectStatusPieChart, EarningsBarChart, RecordingQCChart } from "@/components/admin-analytics-chart"
import { Users, TrendingUp, DollarSign, Briefcase, BarChart3, Target, Award, List } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function getLastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

function getLastNMonths(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (n - 1 - i))
    return d
  })
}

export default async function AdminAnalyticsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  // ── Users created in last 7 days ──
  const days = getLastNDays(7)
  const usersGrowthRaw = await Promise.all(
    days.map(async (day) => {
      const start = new Date(day); start.setHours(0,0,0,0)
      const end   = new Date(day); end.setHours(23,59,59,999)
      const count = await prisma.user.count({ where: { createdAt: { gte: start, lte: end } } })
      return {
        date: day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        users: count
      }
    })
  )

  // ── Project status distribution ──
  const [openCount, inProgressCount, closedCount, cancelledCount] = await Promise.all([
    prisma.project.count({ where: { status: "OPEN" } }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { status: "CLOSED" } }),
    prisma.project.count({ where: { status: "CANCELLED" } }),
  ])
  const projectStatusData = [
    { name: "مفتوح",    value: openCount,       color: "#22c55e" },
    { name: "جاري",     value: inProgressCount, color: "#f59e0b" },
    { name: "مغلق",     value: closedCount,      color: "#6366f1" },
    { name: "ملغى",     value: cancelledCount,   color: "#ef4444" },
  ].filter(d => d.value > 0)

  // ── Monthly earnings (last 6 months) ──
  const months = getLastNMonths(6)
  const earningsRaw = await Promise.all(
    months.map(async (month) => {
      const start = new Date(month.getFullYear(), month.getMonth(), 1)
      const end   = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
      const apps  = await prisma.application.findMany({
        where: { status: "PAID", updatedAt: { gte: start, lte: end } },
        include: { project: { select: { price: true } } }
      })
      const total = apps.reduce((s, a) => s + (a.project?.price || 0), 0)
      return {
        month: month.toLocaleDateString("en-US", { month: "short" }),
        earnings: parseFloat(total.toFixed(2))
      }
    })
  )

  // ── KPI metrics ──
  const [totalUsers, totalProjects, totalPaid, totalPending, verifiedUsers, avgRatingResult, recordingsByStatus, topProjects] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.application.count({ where: { status: "PAID" } }),
    prisma.application.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.user.aggregate({ _avg: { rating: true }, where: { rating: { gt: 0 } } }),
    prisma.voiceRecording.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.project.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        _count: { select: { applications: true, sentences: true } }
      },
      take: 5,
      orderBy: { applications: { _count: 'desc' } }
    })
  ])
  const allPaidApps = await prisma.application.findMany({
    where: { status: "PAID" },
    include: { project: { select: { price: true } } }
  })
  const totalRevenue = allPaidApps.reduce((s, a) => s + (a.project?.price || 0), 0)
  const avgRating    = avgRatingResult._avg.rating?.toFixed(1) || "—"
  const approvalRate = totalPaid + totalPending > 0
    ? Math.round((totalPaid / (totalPaid + totalPending)) * 100)
    : 0

  const kpis = [
    { label: "إجمالي المستخدمين",       value: totalUsers.toLocaleString(),    icon: Users,      color: "text-blue-500 bg-blue-500/10" },
    { label: "إجمالي الأرباح المدفوعة", value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, color: "text-green-500 bg-green-500/10" },
    { label: "إجمالي المشاريع",         value: totalProjects.toLocaleString(), icon: Briefcase,  color: "text-purple-500 bg-purple-500/10" },
    { label: "معدل القبول",            value: `${approvalRate}%`,             icon: Target,     color: "text-orange-500 bg-orange-500/10" },
    { label: "مستخدمون موثّقون",        value: verifiedUsers.toLocaleString(), icon: Award,      color: "text-cyan-500 bg-cyan-500/10" },
    { label: "متوسط التقييم",           value: avgRating,                       icon: TrendingUp, color: "text-yellow-500 bg-yellow-500/10" },
  ]

  // Translate Status for QC Chart
  const STATUS_ARABIC: Record<string, string> = {
    ACCEPTED: 'مقبول',
    REJECTED: 'مرفوض',
    PENDING: 'قيد المراجعة',
    NEED_RE_RECORD: 'إعادة تسجيل'
  }
  
  const STATUS_COLORS: Record<string, string> = {
    ACCEPTED: '#22c55e',
    REJECTED: '#ef4444',
    PENDING: '#f59e0b',
    NEED_RE_RECORD: '#8b5cf6'
  }

  const qcData = recordingsByStatus.map(r => ({
    status: STATUS_ARABIC[r.status] || r.status,
    count: r._count._all,
    color: STATUS_COLORS[r.status] || '#6366f1'
  }))

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <span className="text-sm font-bold text-primary uppercase tracking-wider">Admin</span>
        <h1 className="text-3xl font-black text-foreground mt-1 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Analytics Dashboard
        </h1>
        <p className="text-foreground/60 mt-1">Platform performance overview and insights</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up stagger-1">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="glass p-5 rounded-2xl border border-border hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-foreground/60 font-semibold leading-tight">{kpi.label}</p>
            </div>
            <h3 className="text-2xl font-black text-foreground animate-count">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 animate-slide-up stagger-2">
        {/* Users Growth */}
        <div className="glass p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-bold mb-1">نمو المستخدمين</h2>
          <p className="text-xs text-foreground/50 mb-4">آخر 7 أيام</p>
          <UsersGrowthChart data={usersGrowthRaw} />
        </div>

        {/* Project Status Pie */}
        <div className="glass p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-bold mb-1">توزيع المشاريع</h2>
          <p className="text-xs text-foreground/50 mb-4">حسب الحالة الحالية</p>
          {projectStatusData.length > 0 ? (
            <ProjectStatusPieChart data={projectStatusData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-foreground/30 text-sm">
              لا توجد مشاريع بعد
            </div>
          )}
        </div>
      </div>

      {/* Earnings Bar Chart */}
      <div className="glass p-6 rounded-2xl border border-border animate-slide-up stagger-3">
        <h2 className="text-lg font-bold mb-1">الأرباح الشهرية</h2>
        <p className="text-xs text-foreground/50 mb-4">آخر 6 أشهر (المدفوعات الفعلية)</p>
        <EarningsBarChart data={earningsRaw} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 animate-slide-up stagger-4">
        {/* QC Distribution */}
        <div className="glass p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-bold mb-1">توزيع جودة التسجيلات (QC)</h2>
          <p className="text-xs text-foreground/50 mb-4">عدد المقاطع حسب حالة المراجعة</p>
          <RecordingQCChart data={qcData} />
        </div>

        {/* Top Active Projects */}
        <div className="glass p-6 rounded-2xl border border-border overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><List className="w-5 h-5 text-primary" /> المشاريع الأكثر نشاطاً</h2>
          <p className="text-xs text-foreground/50 mb-4">أعلى المشاريع من حيث التقديمات</p>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-foreground/50 border-b border-border">
                <tr>
                  <th className="pb-3 font-semibold px-4">عنوان المشروع</th>
                  <th className="pb-3 font-semibold px-4 text-center">المتقدمين</th>
                  <th className="pb-3 font-semibold px-4 text-center">الجمل</th>
                  <th className="pb-3 font-semibold px-4 text-left">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topProjects.map(p => (
                  <tr key={p.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="py-4 px-4 font-bold text-foreground truncate max-w-[150px]" title={p.title}>{p.title}</td>
                    <td className="py-4 px-4 text-center font-medium">{p._count.applications}</td>
                    <td className="py-4 px-4 text-center font-medium">{p._count.sentences}</td>
                    <td className="py-4 px-4 text-left">
                      <Link href={`/admin/projects/edit/${p.id}`} className="text-primary font-bold hover:underline">
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
                {topProjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-foreground/50">لا توجد مشاريع.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
