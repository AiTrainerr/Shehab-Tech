"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { uploadAudioToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"
import { createAuditLog } from "@/app/actions/audit"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"

// ─── Admin: Upload script/sentences (Excel, CSV, TXT, or Manual) ─────────────
export async function uploadSentences(
  projectId: string,
  formData: FormData
) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    let sentences: string[] = []
    const mode = formData.get("mode") as string // "file" or "manual"

    if (mode === "manual") {
      const manualText = formData.get("manualText") as string
      if (!manualText || !manualText.trim()) {
        return { success: false, error: "Manual text is empty" }
      }
      // Split by newlines, filter empty lines
      sentences = manualText
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean)
    } else {
      const file = formData.get("file") as File
      if (!file) return { success: false, error: "No file uploaded" }

      const name = file.name.toLowerCase()
      const buffer = Buffer.from(await file.arrayBuffer())

      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        const workbook = XLSX.read(buffer, { type: "buffer" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        sentences = rows
          .map((row: any[]) => {
            for (const cell of row) {
              if (cell !== undefined && cell !== null && String(cell).trim()) {
                return String(cell).trim()
              }
            }
            return null
          })
          .filter(Boolean) as string[]
      } else if (name.endsWith(".txt")) {
        const text = buffer.toString("utf-8")
        sentences = text
          .split("\n")
          .map(s => s.trim())
          .filter(Boolean)
      } else {
        return { success: false, error: "Unsupported file format. Please upload XLSX, CSV, or TXT." }
      }
    }

    if (sentences.length === 0) {
      return { success: false, error: "No sentences could be parsed." }
    }

    // Delete existing sentences for this project
    await prisma.projectSentence.deleteMany({ where: { projectId } })

    // Create new sentences
    await prisma.projectSentence.createMany({
      data: sentences.map((text, i) => ({
        projectId,
        text,
        order: i + 1
      }))
    })

    // Log the action
    await createAuditLog(
      "UPLOAD_SCRIPT",
      `Uploaded ${sentences.length} script sentences/texts for project ${projectId}`
    )

    revalidatePath(`/member/projects/${projectId}`)
    revalidatePath(`/admin/projects`)
    return { success: true, count: sentences.length }
  } catch (e: any) {
    console.error("Upload sentences error:", e)
    return { success: false, error: "Failed to process script file: " + e.message }
  }
}

// ─── Freelancer: Upload a single recording ────────────────────────────────
export async function uploadVoiceRecording(
  sentenceId: string,
  formData: FormData
) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const audioFile = formData.get("audio") as File
    if (!audioFile) return { success: false, error: "No audio file" }

    // Read audio specs passed from client validation
    const fileSize = parseInt(formData.get("fileSize") as string || "0")
    const duration = parseFloat(formData.get("duration") as string || "0")
    const audioFormat = formData.get("audioFormat") as string || "WAV"
    const sampleRate = parseInt(formData.get("sampleRate") as string || "44100")
    const bitDepth = parseInt(formData.get("bitDepth") as string || "16")
    const channels = formData.get("channels") as string || "MONO"

    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const filename = `${sentenceId}_${user.id}_${Date.now()}`

    const { url, publicId } = await uploadAudioToCloudinary(buffer, filename)

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h expiration placeholder

    // Upsert recording metadata
    await prisma.voiceRecording.upsert({
      where: { sentenceId_userId: { sentenceId, userId: user.id } },
      create: {
        sentenceId,
        userId: user.id,
        fileUrl: url,
        publicId,
        expiresAt,
        status: "PENDING",
        fileSize,
        duration,
        audioFormat,
        sampleRate,
        bitDepth,
        channels
      },
      update: {
        fileUrl: url,
        publicId,
        expiresAt,
        status: "PENDING",
        fileSize,
        duration,
        audioFormat,
        sampleRate,
        bitDepth,
        channels,
        movedToCloud: false
      }
    })

    // Log the file upload action
    await createAuditLog(
      "UPLOAD_RECORDING",
      `Uploaded recording for sentence ${sentenceId}. Format: ${audioFormat}, Sample Rate: ${sampleRate}Hz, Size: ${fileSize} bytes`
    )

    return { success: true, url }
  } catch (e: any) {
    console.error("Upload recording error:", e)
    return { success: false, error: "Failed to upload recording: " + e.message }
  }
}

// ─── QC: Review / Approve / Reject Recording ──────────────────────────────
export async function reviewVoiceRecording(
  recordingId: string,
  status: "ACCEPTED" | "REJECTED" | "NEED_RE_RECORD",
  rejectionReason?: string
) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, firstName: true, lastName: true } })
    if (!["ADMIN", "SUPER_ADMIN", "QC_REVIEWER"].includes(dbUser?.role || "")) {
      return { success: false, error: "Unauthorized" }
    }

    const reviewerName = `${dbUser?.firstName} ${dbUser?.lastName}`

    const updated = await prisma.voiceRecording.update({
      where: { id: recordingId },
      data: {
        status,
        rejectionReason: rejectionReason || null,
        reviewedBy: reviewerName
      },
      include: {
        sentence: true,
        user: true
      }
    })

    // Notify the user about the status update
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title: `Recording Status Update: ${status}`,
        content: status === "ACCEPTED"
          ? `Your recording for sentence "${updated.sentence.text.slice(0, 30)}..." has been accepted.`
          : `Your recording for sentence "${updated.sentence.text.slice(0, 30)}..." requires attention: ${rejectionReason || "No details provided"}.`,
        link: `/member/projects/${updated.sentence.projectId}`
      }
    })

    // Log action
    await createAuditLog(
      `QC_REVIEW_${status}`,
      `QC Reviewer ${reviewerName} reviewed recording ${recordingId} as ${status}. Reason: ${rejectionReason || "N/A"}`
    )

    return { success: true }
  } catch (e: any) {
    console.error("QC Review error:", e)
    return { success: false, error: e.message }
  }
}

// ─── Get all recordings for a user on a project ───────────────────────────
export async function getProjectRecordings(projectId: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, sentences: [] }

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
