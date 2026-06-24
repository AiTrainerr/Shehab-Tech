import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, canReviewQC: true }
    })

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: params.taskId }
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
        where: { id: params.taskId },
        data: { status, updatedAt: new Date() }
      })

      // 2. Create review record
      await tx.transcriptionReview.create({
        data: {
          taskId: params.taskId,
          moderatorId: userId,
          status,
          notes: notes || null
        }
      })

      // 3. Create notification for the assigned freelancer
      if (task.assignedToId) {
        await tx.notification.create({
          data: {
            userId: task.assignedToId,
            title: `تم مراجعة تفريغ المشروع`,
            content: status === "APPROVED" 
              ? `تهانينا! تم قبول عملك في المشروع بنجاح.` 
              : `تم طلب تعديلات على عملك. يرجى المراجعة: ${notes}`,
            link: `/member/transcription/${task.id}`
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Review transcription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
