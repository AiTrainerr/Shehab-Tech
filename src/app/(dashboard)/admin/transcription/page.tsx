import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Headphones } from "lucide-react"
import { AdminTranscriptionClient } from "./AdminTranscriptionClient"

export const dynamic = "force-dynamic"

export default async function AdminTranscriptionQueuePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, assignedProjects: { select: { id: true } }, canReviewQC: true, moderatorType: true, teamLeaderId: true }
  })

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
    redirect("/admin")
  }

  const whereClause: any = {}
  if (currentUser?.role === "MODERATOR") {
    const assignedIds = currentUser.assignedProjects?.map(p => p.id) || []
    whereClause.projectId = assignedIds.length > 0 ? { in: assignedIds } : "none"
    
    if (currentUser.moderatorType === "OUTSOURCED") {
      whereClause.assignedTo = { teamLeaderId: currentUser.id }
    } else if (currentUser.moderatorType === "QA") {
      whereClause.assignedTo = { teamLeaderId: currentUser.teamLeaderId }
    } else {
      whereClause.assignedTo = { teamLeaderId: null }
    }
  }

  const tasks = await prisma.transcriptionTask.findMany({
    where: whereClause,
    include: {
      project: { select: { title: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      qcAssignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { segments: true } }
    },
    orderBy: { updatedAt: "desc" }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Headphones className="w-7 h-7 text-primary" />
            QA Queue (Audio Transcription)
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Review submitted tasks and export final files</p>
        </div>
      </div>

      <AdminTranscriptionClient tasks={tasks as any} />
    </div>
  )
}
