import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamRole: true, teamLeaderId: true }
    })

    const isQC = user?.teamRole === "QC"

    if (isQC) {
      if (task.qcAssignedToId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      
      await prisma.transcriptionTask.update({
        where: { id: taskId },
        data: { status: "APPROVED_BY_QC", updatedAt: new Date() }
      })
      
    } else {
      if (task.assignedToId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      
      const newStatus = task.teamId ? "SUBMITTED_TO_QC" : "SUBMITTED"
      
      await prisma.transcriptionTask.update({
        where: { id: taskId },
        data: { status: newStatus, updatedAt: new Date() }
      })
    }

    // --- AUTO-CLAIM NEXT TASK LOGIC ---
    let nextTask = null
    const teamIdToSet = user?.teamLeaderId || null

    if (isQC) {
      // Find next task for QC
      nextTask = await prisma.transcriptionTask.findFirst({
        where: {
          projectId: task.projectId,
          status: "SUBMITTED_TO_QC",
          teamId: teamIdToSet,
          qcAssignedToId: null
        },
        orderBy: { createdAt: "asc" }
      })
      if (nextTask) {
        await prisma.transcriptionTask.updateMany({
          where: { id: nextTask.id, qcAssignedToId: null, status: "SUBMITTED_TO_QC" },
          data: { qcAssignedToId: userId, status: "UNDER_QC_REVIEW" }
        })
      }
    } else {
      // Find next task for Transcriber
      nextTask = await prisma.transcriptionTask.findFirst({
        where: {
          projectId: task.projectId,
          status: { in: ["AVAILABLE", "REJECTED"] },
          assignedToId: null
        },
        orderBy: { createdAt: "asc" }
      })
      if (nextTask) {
        await prisma.transcriptionTask.updateMany({
          where: { id: nextTask.id, assignedToId: null, status: nextTask.status },
          data: { assignedToId: userId, status: "ASSIGNED", teamId: teamIdToSet }
        })
      }
    }

    // Verify claim succeeded (in case of race conditions)
    let finalNextTaskId = null
    if (nextTask) {
      const verifyClaim = await prisma.transcriptionTask.findUnique({ where: { id: nextTask.id } })
      if (isQC && verifyClaim?.qcAssignedToId === userId) finalNextTaskId = nextTask.id
      if (!isQC && verifyClaim?.assignedToId === userId) finalNextTaskId = nextTask.id
    }

    return NextResponse.json({ 
      success: true, 
      nextTaskId: finalNextTaskId,
      projectId: task.projectId 
    })
  } catch (error) {
    console.error("Submit transcription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
