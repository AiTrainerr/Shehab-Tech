import { prisma } from "@/lib/prisma"
import { Users, Shield, BadgeCheck, Clock, XCircle } from "lucide-react"
import { AdminUsersClient } from "./AdminUsersClient"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [users, projects, reviewedCounts] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,        // Only shown here (admin page)
        phone: true,        // Only shown here (admin page)
        whatsapp: true,     // Only shown here (admin page)
        country: true,
        gender: true,
        age: true,
        ranking: true,
        completedCount: true,
        rating: true,
        verificationStatus: true,
        role: true,
        isApproved: true,
        assignedProjects: { select: { id: true } },
        canReviewQC: true,
        canApproveApplications: true,
        createdAt: true,
        _count: { select: { applications: true, portfolios: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.project.findMany({
      select: { id: true, title: true }
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

  const usersWithCounts = users.map(user => ({
    ...user,
    reviewedCount: reviewedMap[user.id] || 0
  }))

  const statusConfig = {
    VERIFIED:  { label: "Verified",  icon: <BadgeCheck className="w-4 h-4 text-white fill-green-500" />, cls: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    PENDING:   { label: "Pending",   icon: <Clock className="w-4 h-4" />,       cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
    REJECTED:  { label: "Rejected",  icon: <XCircle className="w-4 h-4" />,     cls: "text-red-500 bg-red-500/10 border-red-500/20" },
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" /> Members ({users.length})
            </h1>
            <p className="text-foreground/70">All registered freelancers. Sensitive info (email, phone) is only visible here.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Shield className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-500">Admin Only View</span>
          </div>
        </div>

        <AdminUsersClient initialUsers={usersWithCounts} statusConfig={statusConfig} projects={projects} />
      </div>
    </main>
  )
}
