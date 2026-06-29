"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function editTranscriptionTask(taskId: string, data: { audioFilePath?: string, speakerCount?: number, status?: string }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return { success: false, error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, canReviewQC: true } })
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN" && !user?.canReviewQC) {
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
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return { success: false, error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, canReviewQC: true } })
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN" && !user?.canReviewQC) {
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
