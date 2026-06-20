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
      const recordings = await prisma.voiceRecording.groupBy({
        by: ['status'],
        where: {
          userId: app.userId,
          sentence: { projectId: app.projectId }
        },
        _count: { _all: true }
      })
      
      let recordedCount = 0;
      let pendingCount = 0;
      let reRecordCount = 0;
      let acceptedCount = 0;

      recordings.forEach(r => {
        recordedCount += r._count._all;
        if (r.status === 'PENDING') pendingCount = r._count._all;
        if (r.status === 'NEED_RE_RECORD') reRecordCount = r._count._all;
        if (r.status === 'ACCEPTED') acceptedCount = r._count._all;
      })

      const totalSentences = await prisma.projectSentence.count({
        where: { projectId: app.projectId }
      })
      
      let reviewCategory = "WORKING";

      if (app.status === 'FINAL_REVIEW' || app.status === 'APPROVED' || app.status === 'PAID') {
        reviewCategory = "COMPLETED";
      } else if (reRecordCount > 0) {
        reviewCategory = "NEEDS_FIX";
      } else if (pendingCount > 0 && recordedCount >= totalSentences) {
        if (acceptedCount > 0) {
          reviewCategory = "READY_FIXED";
        } else {
          reviewCategory = "READY_FIRST";
        }
      } else if (pendingCount === 0 && recordedCount >= totalSentences && acceptedCount === totalSentences) {
        reviewCategory = "COMPLETED";
      } else {
        reviewCategory = "WORKING";
      }

      const isCompleted = totalSentences > 0 && recordedCount >= totalSentences

      return { 
        ...app, 
        recordedCount, 
        totalSentences, 
        isCompleted, 
        reviewCategory,
        pendingCount,
        reRecordCount,
        acceptedCount
      }
    })
  )

  // Sort them so they appear in order of priority when viewing "All"
  applications.sort((a, b) => {
    const priority = {
      "READY_FIXED": 1,
      "READY_FIRST": 2,
      "NEEDS_FIX": 3,
      "WORKING": 4,
      "COMPLETED": 5
    }
    const pA = priority[a.reviewCategory as keyof typeof priority] || 99
    const pB = priority[b.reviewCategory as keyof typeof priority] || 99
    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
