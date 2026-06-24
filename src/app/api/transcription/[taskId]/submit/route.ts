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
      select: { teamRole: true }
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Submit transcription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
