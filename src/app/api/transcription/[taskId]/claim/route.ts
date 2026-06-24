import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: params.taskId },
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

    // Check if task is already assigned
    if (task.assignedToId) {
      if (task.assignedToId === userId) {
        return NextResponse.json({ success: true, message: "Already claimed by you" })
      }
      return NextResponse.json({ error: "This task has already been claimed by someone else." }, { status: 400 })
    }

    // Claim the task atomically
    await prisma.transcriptionTask.updateMany({
      where: { id: params.taskId, assignedToId: null, status: "AVAILABLE" },
      data: { assignedToId: userId, status: "ASSIGNED" }
    })

    // Verify it was actually claimed by this user (handles concurrency)
    const verifyClaim = await prisma.transcriptionTask.findUnique({
      where: { id: params.taskId }
    })

    if (verifyClaim?.assignedToId !== userId) {
      return NextResponse.json({ error: "Failed to claim task. It may have been claimed by someone else." }, { status: 409 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Claim task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
