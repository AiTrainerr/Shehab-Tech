"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { createAuditLog } from "@/app/actions/audit"
import { revalidatePath } from "next/cache"
import { v2 as cloudinary } from "cloudinary"

const TOTAL_STORAGE_LIMIT_BYTES = 25 * 1024 * 1024 * 1024 // 25 GB limit

export async function getStorageStats() {
  try {
    // Account 1: Voice Recordings
    const recordingsUsage = await cloudinary.api.usage({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    }).catch(() => null)

    // Account 2: Transcriptions
    const transcriptionsUsage = await cloudinary.api.usage({
      cloud_name: process.env.CLOUDINARY_TRANSCRIPTION_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_TRANSCRIPTION_API_KEY,
      api_secret: process.env.CLOUDINARY_TRANSCRIPTION_API_SECRET
    }).catch(() => null)

    const recordingsCreditsUsed = recordingsUsage?.credits?.usage || 0
    const transcriptionsCreditsUsed = transcriptionsUsage?.credits?.usage || 0

    // 1 Credit = 1 GB (Approx)
    const recUsedBytes = recordingsCreditsUsed * 1024 * 1024 * 1024
    const transUsedBytes = transcriptionsCreditsUsed * 1024 * 1024 * 1024

    return {
      recordings: {
        totalBytes: TOTAL_STORAGE_LIMIT_BYTES,
        usedBytes: recUsedBytes,
        remainingBytes: Math.max(0, TOTAL_STORAGE_LIMIT_BYTES - recUsedBytes),
        percentageUsed: (recUsedBytes / TOTAL_STORAGE_LIMIT_BYTES) * 100
      },
      transcriptions: {
        totalBytes: TOTAL_STORAGE_LIMIT_BYTES,
        usedBytes: transUsedBytes,
        remainingBytes: Math.max(0, TOTAL_STORAGE_LIMIT_BYTES - transUsedBytes),
        percentageUsed: (transUsedBytes / TOTAL_STORAGE_LIMIT_BYTES) * 100
      }
    }
  } catch (error) {
    console.error("Failed to fetch storage statistics:", error)
    return {
      recordings: { totalBytes: TOTAL_STORAGE_LIMIT_BYTES, usedBytes: 0, remainingBytes: TOTAL_STORAGE_LIMIT_BYTES, percentageUsed: 0 },
      transcriptions: { totalBytes: TOTAL_STORAGE_LIMIT_BYTES, usedBytes: 0, remainingBytes: TOTAL_STORAGE_LIMIT_BYTES, percentageUsed: 0 }
    }
  }
}

export async function checkAndTriggerStorageWarning() {
  try {
    const stats = await getStorageStats()
    const fiveGBytes = 5 * 1024 * 1024 * 1024

    if (stats.recordings.remainingBytes <= fiveGBytes || stats.transcriptions.remainingBytes <= fiveGBytes) {
      // Find all users who have active recordings stored
      const activeRecordings = await prisma.voiceRecording.findMany({
        where: { movedToCloud: false },
        select: { userId: true },
        distinct: ["userId"]
      })

      const userIds = activeRecordings.map(r => r.userId)
      if (userIds.length === 0) return { triggered: false, message: "No active users to notify" }

      const remainingRec = (stats.recordings.remainingBytes / (1024 * 1024 * 1024)).toFixed(2)
      const remainingTrans = (stats.transcriptions.remainingBytes / (1024 * 1024 * 1024)).toFixed(2)

      // Bulk create notifications
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          title: "Low Storage Space Warning ⚠️",
          content: `Platform storage space is low (Recordings: ${remainingRec} GB, Transcriptions: ${remainingTrans} GB). Please be careful.`,
          link: "/member"
        }))
      })

      await createAuditLog(
        "STORAGE_WARNING_TRIGGERED",
        `Triggered low storage warning notifications. Rec remaining: ${remainingRec} GB, Trans remaining: ${remainingTrans} GB`
      )

      return { triggered: true, notifiedUsersCount: userIds.length }
    }

    return { triggered: false, message: "Storage levels normal" }
  } catch (error: any) {
    console.error("Storage warning trigger error:", error)
    return { triggered: false, error: error.message }
  }
}

export async function adminExecuteCleanup(reason: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, firstName: true, lastName: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Find all voice recordings that are expired (expiresAt < now)
    const expiredRecordings = await prisma.voiceRecording.findMany({
      where: {
        expiresAt: { lt: new Date() },
        movedToCloud: false
      },
      include: { user: true }
    })

    if (expiredRecordings.length === 0) {
      return { success: true, count: 0, message: "No expired recordings to clean up" }
    }

    // Delete files from Cloudinary and mark as movedToCloud in DB
    for (const rec of expiredRecordings) {
      try {
        await deleteFromCloudinary(rec.publicId)
      } catch (err) {
        console.error(`Failed to delete asset ${rec.publicId} from Cloudinary:`, err)
      }
      await prisma.voiceRecording.update({
        where: { id: rec.id },
        data: { movedToCloud: true }
      })
    }

    const adminName = `${dbUser.firstName} ${dbUser.lastName}`
    const detailsText = `Admin "${adminName}" executed manual cleanup of ${expiredRecordings.length} expired recording files. Reason: ${reason}`

    // Log the manual delete operation in AuditLog
    await createAuditLog("MANUAL_STORAGE_CLEANUP", detailsText)

    revalidatePath("/admin/storage")
    return { success: true, count: expiredRecordings.length }
  } catch (error: any) {
    console.error("Admin cleanup error:", error)
    return { success: false, error: error.message }
  }
}
