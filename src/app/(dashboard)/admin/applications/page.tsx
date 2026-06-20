import { prisma } from "@/lib/prisma"
import { Users, Filter } from "lucide-react"
import { AdminApplicationsClient } from "./AdminApplicationsClient"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, assignedProjectId: true, canApproveApplications: true }
  })

  if (currentUser?.role === "MODERATOR" && !currentUser.canApproveApplications) {
    redirect("/admin")
  }

  const whereClause = currentUser?.role === "MODERATOR"
    ? { projectId: currentUser.assignedProjectId || "none" }
    : {}

  const applicationsData = await prisma.application.findMany({
    where: whereClause,
    include: {
      project: { select: { id: true, title: true, pricingModel: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true, ranking: true, verificationStatus: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  const applications = await Promise.all(
    applicationsData.map(async (app) => {
      if (app.project.pricingModel === "PER_SENTENCE") {
        const recordedCount = await prisma.voiceRecording.count({
          where: {
            userId: app.userId,
            sentence: { projectId: app.projectId }
          }
        })
        return { ...app, recordedCount }
      }
      return { ...app, recordedCount: 0 }
    })
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Project Applications
        </h1>
        <p className="text-foreground/70">Review freelancer applications and manage approvals.</p>
      </div>

      <AdminApplicationsClient applications={applications} />
    </div>
  )
}
