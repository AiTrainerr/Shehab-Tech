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
    const currentUser = auth.user

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN" && !currentUser.canReviewQC) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const userId = currentUser.id

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const body = await req.json()
    const { status, notes } = body

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update task status
      await tx.transcriptionTask.update({
        where: { id: taskId },
        data: { status, updatedAt: new Date() }
      })

      // 2. Create review record
      await tx.transcriptionReview.create({
        data: {
          taskId: taskId,
          moderatorId: userId,
          status,
          notes: notes || null
        }
      })

      // 3. Create notification for the assigned freelancer (COMMENTED OUT to prevent spam)
      /*
      if (task.assignedToId) {
        await tx.notification.create({
          data: {
            userId: task.assignedToId,
            title: `Transcription Project Reviewed`,
            content: status === "APPROVED" 
              ? `Congratulations! Your work in the project has been successfully approved.` 
              : `Edits have been requested on your work. Please review: ${notes}`,
            link: `/member/transcription/${task.id}`
          }
        })
      }
      */
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Review transcription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
