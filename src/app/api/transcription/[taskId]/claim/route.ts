import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const auth = await requireApiAuth()
    if ("errorResponse" in auth) {
      return auth.errorResponse
    }
    const userId = auth.user.id

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if the user is an approved applicant for this project
    const application = await prisma.application.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId } }
    })

    if (!application || application.status !== "APPROVED" && application.status !== "ACCEPTED" && application.status !== "WORKING") {
      return NextResponse.json({ error: "You must be approved to work on this project." }, { status: 403 })
    }

    // Get user to check team membership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamLeaderId: true, teamRole: true }
    })

    const isQC = user?.teamRole === "QC"
    const teamIdToSet = user?.teamLeaderId || null

    if (isQC) {
      // QC can only claim tasks that are SUBMITTED_TO_QC and belong to their team
      if (task.status !== "SUBMITTED_TO_QC") {
        return NextResponse.json({ error: "Task is not ready for QC." }, { status: 400 })
      }
      if (task.teamId && task.teamId !== teamIdToSet) {
        return NextResponse.json({ error: "This task belongs to another team." }, { status: 403 })
      }
      
      if (task.qcAssignedToId) {
        if (task.qcAssignedToId === userId) return NextResponse.json({ success: true, message: "Already claimed by you" })
        return NextResponse.json({ error: "Already claimed by another QC." }, { status: 400 })
      }

      await prisma.transcriptionTask.updateMany({
        where: { id: taskId, qcAssignedToId: null, status: "SUBMITTED_TO_QC" },
        data: { qcAssignedToId: userId, status: "UNDER_QC_REVIEW" }
      })

      const verifyClaim = await prisma.transcriptionTask.findUnique({ where: { id: taskId } })
      if (verifyClaim?.qcAssignedToId !== userId) {
        return NextResponse.json({ error: "Failed to claim task. It may have been claimed by someone else." }, { status: 409 })
      }
    } else {
      // Transcriber or Freelancer claiming AVAILABLE task
      if (task.status !== "AVAILABLE" && task.status !== "REJECTED") {
        return NextResponse.json({ error: "Task is not available." }, { status: 400 })
      }

      if (task.assignedToId) {
        if (task.assignedToId === userId) return NextResponse.json({ success: true, message: "Already claimed by you" })
        return NextResponse.json({ error: "This task has already been claimed by someone else." }, { status: 400 })
      }

      await prisma.transcriptionTask.updateMany({
        where: { id: taskId, assignedToId: null, status: task.status }, // handle both AVAILABLE and REJECTED
        data: { assignedToId: userId, status: "ASSIGNED", teamId: teamIdToSet }
      })

      const verifyClaim = await prisma.transcriptionTask.findUnique({ where: { id: taskId } })
      if (verifyClaim?.assignedToId !== userId) {
        return NextResponse.json({ error: "Failed to claim task. It may have been claimed by someone else." }, { status: 409 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Claim task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
