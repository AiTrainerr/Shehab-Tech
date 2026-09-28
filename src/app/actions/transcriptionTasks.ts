"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"

export async function editTranscriptionTask(taskId: string, data: { audioFilePath?: string, speakerCount?: number, status?: string }) {
  try {
    const user = await requireUser()
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && !user.canReviewQC) {
      return { success: false, error: "Forbidden" }
    }

    await prisma.transcriptionTask.update({
      where: { id: taskId },
      data: {
        ...(data.audioFilePath && { audioFilePath: data.audioFilePath }),
        ...(data.speakerCount && { speakerCount: data.speakerCount }),
        ...(data.status && { status: data.status as any }),
      }
    })

    revalidatePath(`/admin/transcription/qa/${taskId}`)
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message }
  }
}

export async function addTranscriptionTask(projectId: string, audioFilePath: string, durationSeconds: number) {
  try {
    const user = await requireUser()
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && !user.canReviewQC) {
      return { success: false, error: "Forbidden" }
    }

    await prisma.transcriptionTask.create({
      data: {
        projectId,
        audioFilePath,
        duration: durationSeconds,
        speakerCount: 1,
        status: "PENDING"
      }
    })

    revalidatePath(`/admin/transcription/qa`)
    revalidatePath(`/admin/projects`)
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message }
  }
}
