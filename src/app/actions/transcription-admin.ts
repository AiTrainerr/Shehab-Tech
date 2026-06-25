"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function unassignTranscriptionTask(taskId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Check if admin/mod
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, canReviewQC: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
      return { success: false, error: "Unauthorized" }
    }

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: taskId }
    })

    if (!task) return { success: false, error: "Task not found" }

    // Logic: If it is under QC, unassign QC and return to SUBMITTED_TO_QC
    // If it is assigned to transcriber, unassign transcriber and return to AVAILABLE
    let updateData: any = {}

    if (task.status === "UNDER_QC_REVIEW") {
      updateData = {
        qcAssignedToId: null,
        status: "SUBMITTED_TO_QC"
      }
    } else if (task.status === "ASSIGNED" || task.status === "REJECTED") {
      updateData = {
        assignedToId: null,
        status: "AVAILABLE",
        teamId: null // Clear team assignment as well
      }
    } else if (task.status === "APPROVED" || task.status === "APPROVED_BY_QC") {
        return { success: false, error: "Cannot unassign an already approved task." }
    } else {
        // If it was just SUBMITTED or SUBMITTED_TO_QC and we want to unassign it... it's not actually claimed.
        // But if we want to reset it entirely:
        updateData = {
            assignedToId: null,
            qcAssignedToId: null,
            status: "AVAILABLE",
            teamId: null
        }
    }

    await prisma.transcriptionTask.update({
      where: { id: taskId },
      data: updateData
    })

    revalidatePath("/admin/transcription")
    return { success: true }
  } catch (error: any) {
    console.error("Unassign task error:", error)
    return { success: false, error: "Failed to unassign task" }
  }
}

export async function suspendUserFromTranscriptionProject(userId: string, projectId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, canReviewQC: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reject their application for this project
      const app = await tx.application.findFirst({
        where: { userId, projectId }
      })

      if (app) {
        await tx.application.update({
          where: { id: app.id },
          data: { status: "REJECTED" }
        })
      }

      // 2. Withdraw Transcriber tasks
      await tx.transcriptionTask.updateMany({
        where: { 
            projectId: projectId, 
            assignedToId: userId,
            status: { in: ["ASSIGNED", "REJECTED"] }
        },
        data: {
            assignedToId: null,
            status: "AVAILABLE",
            teamId: null
        }
      })

      // 3. Withdraw QC tasks
      await tx.transcriptionTask.updateMany({
        where: { 
            projectId: projectId, 
            qcAssignedToId: userId,
            status: "UNDER_QC_REVIEW"
        },
        data: {
            qcAssignedToId: null,
            status: "SUBMITTED_TO_QC"
        }
      })
    })

    revalidatePath("/admin/transcription")
    return { success: true }
  } catch (error: any) {
    console.error("Suspend user error:", error)
    return { success: false, error: "Failed to suspend user" }
  }
}
