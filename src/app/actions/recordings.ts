"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { uploadAudioToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"

// ─── Admin: Upload Excel and parse sentences ───────────────────────────────
export async function uploadSentencesFromExcel(projectId: string, formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    const file = formData.get("excelFile") as File
    if (!file) return { success: false, error: "No file uploaded" }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    // Extract sentences — first non-empty cell of each row
    const sentences: string[] = rows
      .map((row: any[]) => {
        // Support both single column and multi-column (take first string cell)
        for (const cell of row) {
          if (cell && typeof cell === "string" && cell.trim()) return cell.trim()
        }
        return null
      })
      .filter(Boolean) as string[]

    if (sentences.length === 0) return { success: false, error: "No sentences found in file" }

    // Delete existing sentences for this project first
    await prisma.projectSentence.deleteMany({ where: { projectId } })

    // Create new sentences
    await prisma.projectSentence.createMany({
      data: sentences.map((text, i) => ({ projectId, text, order: i + 1 }))
    })

    revalidatePath(`/member/projects/${projectId}`)
    revalidatePath(`/admin/projects`)
    return { success: true, count: sentences.length }
  } catch (e: any) {
    console.error("Upload sentences error:", e)
    return { success: false, error: "Failed to process Excel file" }
  }
}

// ─── Freelancer: Upload a single recording ────────────────────────────────
export async function uploadVoiceRecording(sentenceId: string, formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const audioFile = formData.get("audio") as File
    if (!audioFile) return { success: false, error: "No audio file" }

    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const filename = `${sentenceId}_${user.id}_${Date.now()}`

    const { url, publicId } = await uploadAudioToCloudinary(buffer, filename)

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now

    // Upsert — replace existing recording if re-recorded
    await prisma.voiceRecording.upsert({
      where: { sentenceId_userId: { sentenceId, userId: user.id } },
      create: { sentenceId, userId: user.id, fileUrl: url, publicId, expiresAt },
      update: { fileUrl: url, publicId, expiresAt, movedToCloud: false }
    })

    return { success: true, url }
  } catch (e: any) {
    console.error("Upload recording error:", e)
    return { success: false, error: "Failed to upload recording" }
  }
}

// ─── Get all recordings for a user on a project ───────────────────────────
export async function getProjectRecordings(projectId: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, recordings: [] }

    const sentences = await prisma.projectSentence.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
      include: {
        recordings: {
          where: { userId: user.id }
        }
      }
    })

    return { success: true, sentences }
  } catch (e) {
    return { success: false, sentences: [] }
  }
}

// ─── Cron: Cleanup expired recordings ─────────────────────────────────────
export async function cleanupExpiredRecordings() {
  try {
    const expired = await prisma.voiceRecording.findMany({
      where: {
        expiresAt: { lt: new Date() },
        movedToCloud: false
      }
    })

    for (const rec of expired) {
      await deleteFromCloudinary(rec.publicId)
      await prisma.voiceRecording.update({
        where: { id: rec.id },
        data: { movedToCloud: true }
      })
    }

    return { success: true, deleted: expired.length }
  } catch (e) {
    console.error("Cleanup error:", e)
    return { success: false }
  }
}
