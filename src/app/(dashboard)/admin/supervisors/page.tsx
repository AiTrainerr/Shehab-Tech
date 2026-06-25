import * as React from "react"
import { prisma } from "@/lib/prisma"
import { GrantPermissionsForm } from "@/components/grant-permissions-form"
import { AdminSupervisorsClient } from "@/components/admin-supervisors-client"
import { Shield } from "lucide-react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function SupervisorsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (currentUser?.role === "MODERATOR") {
    redirect("/admin")
  }

  const [allActiveProjects, modsList, reviewedCounts] = await Promise.all([
    prisma.project.findMany({
      where: { status: "OPEN" },
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
        assignedProjects: { select: { id: true } },
        canReviewQC: true,
        canApproveApplications: true,
        moderatorType: true,
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

  const currentModeratorsList = modsList.map(mod => {
    const modName = `${mod.firstName} ${mod.lastName}`
    return {
      ...mod,
      reviewedCount: reviewedMap[modName] || 0
    }
  })

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Supervisors & Permissions
          </h1>
          <p className="text-foreground/70">Manage team leaders and platform admins.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <GrantPermissionsForm projects={allActiveProjects} />
        <AdminSupervisorsClient supervisors={currentModeratorsList} projects={allActiveProjects} />
      </div>
    </main>
  )
}
