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
      select: { assignedToId: true, status: true }
    })

    if (!task || task.assignedToId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (task.status === "SUBMITTED" || task.status === "APPROVED") {
      return NextResponse.json({ error: "Task is locked" }, { status: 400 })
    }

    const body = await req.json()
    const segments = body.segments as Array<{
      id: string
      startTime: number
      endTime: number
      speakerLabel: string
      transcriptText: string
    }>

    // Transaction to replace all segments
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing segments for this task
      await tx.transcriptionSegment.deleteMany({
        where: { taskId: taskId }
      })

      // 2. Insert new segments
      if (segments.length > 0) {
        await tx.transcriptionSegment.createMany({
          data: segments.map(s => ({
            id: s.id.startsWith("wavesurfer") ? undefined : s.id, // Only keep IDs if they were previously saved, else let CUID generate
            taskId: taskId,
            startTime: s.startTime,
            endTime: s.endTime,
            speakerLabel: s.speakerLabel,
            transcriptText: s.transcriptText,
          }))
        })
      }
      
      // Update task updated at
      await tx.transcriptionTask.update({
        where: { id: taskId },
        data: { updatedAt: new Date() }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save transcription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
