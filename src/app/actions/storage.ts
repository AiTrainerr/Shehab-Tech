"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { createAuditLog } from "@/app/actions/audit"
import { revalidatePath } from "next/cache"

const TOTAL_STORAGE_LIMIT_BYTES = 25 * 1024 * 1024 * 1024 // 25 GB limit

export async function getStorageStats() {
  try {
    const aggregate = await prisma.voiceRecording.aggregate({
      where: { movedToCloud: false },
      _sum: { fileSize: true }
    })

    const usedBytes = aggregate._sum.fileSize || 0
    const remainingBytes = Math.max(0, TOTAL_STORAGE_LIMIT_BYTES - usedBytes)

    return {
      totalBytes: TOTAL_STORAGE_LIMIT_BYTES,
      usedBytes,
      remainingBytes,
      percentageUsed: (usedBytes / TOTAL_STORAGE_LIMIT_BYTES) * 100
    }
  } catch (error) {
    console.error("Failed to fetch storage statistics:", error)
    return {
      totalBytes: TOTAL_STORAGE_LIMIT_BYTES,
      usedBytes: 0,
      remainingBytes: TOTAL_STORAGE_LIMIT_BYTES,
      percentageUsed: 0
    }
  }
}

export async function checkAndTriggerStorageWarning() {
  try {
    const stats = await getStorageStats()
    const fiveGBytes = 5 * 1024 * 1024 * 1024

    if (stats.remainingBytes <= fiveGBytes) {
      // Find all users who have active recordings stored
      const activeRecordings = await prisma.voiceRecording.findMany({
        where: { movedToCloud: false },
        select: { userId: true },
        distinct: ["userId"]
      })

      const userIds = activeRecordings.map(r => r.userId)
      if (userIds.length === 0) return { triggered: false, message: "No active users to notify" }

      const remainingGB = (stats.remainingBytes / (1024 * 1024 * 1024)).toFixed(2)

      // Bulk create notifications
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          title: "Low Storage Space Warning ⚠️",
          content: `Platform storage space is low (Remaining: ${remainingGB} GB). Your files may be auto-cleaned up in 24 hours. Please download your important files immediately.`,
          link: "/member"
        }))
      })

      await createAuditLog(
        "STORAGE_WARNING_TRIGGERED",
        `Triggered low storage warning notifications for ${userIds.length} users. Remaining: ${remainingGB} GB`
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
