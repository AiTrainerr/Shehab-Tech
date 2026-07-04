"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { createAuditLog } from "@/app/actions/audit"
import { createManyNotifications } from "@/app/actions/notifications"
import { revalidatePath } from "next/cache"

const TOTAL_STORAGE_LIMIT_BYTES = 25 * 1024 * 1024 * 1024 // 25 GB limit

async function fetchCloudinaryUsage(cloudName: string, apiKey: string, apiSecret: string) {
  try {
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getStorageStats() {
  try {
    let accounts: { cloudName: string, apiKey: string, apiSecret: string }[] = [];
    if (process.env.CLOUDINARY_ACCOUNTS) {
      accounts = JSON.parse(process.env.CLOUDINARY_ACCOUNTS);
    } else {
      accounts = [{
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!
      }];
    }

    let totalCreditsUsed = 0;
    
    await Promise.all(accounts.map(async (acc) => {
      const usage = await fetchCloudinaryUsage(acc.cloudName, acc.apiKey, acc.apiSecret);
      if (usage && usage.credits && usage.credits.usage) {
        totalCreditsUsed += usage.credits.usage;
      }
    }));

    // Each free account has 25 Credits
    const TOTAL_STORAGE_LIMIT_BYTES = accounts.length * 25 * 1024 * 1024 * 1024;
    const recUsedBytes = totalCreditsUsed * 1024 * 1024 * 1024;

    return {
      recordings: {
        totalBytes: TOTAL_STORAGE_LIMIT_BYTES,
        usedBytes: recUsedBytes,
        remainingBytes: Math.max(0, TOTAL_STORAGE_LIMIT_BYTES - recUsedBytes),
        percentageUsed: (recUsedBytes / TOTAL_STORAGE_LIMIT_BYTES) * 100
      },
      transcriptions: {
        totalBytes: 25 * 1024 * 1024 * 1024,
        usedBytes: 0, // Mocked for now to avoid confusion, or can be separated if needed
        remainingBytes: 25 * 1024 * 1024 * 1024,
        percentageUsed: 0
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
      const activeRecordings = await prisma.voiceRecording.findMany({
        where: { movedToCloud: false },
        select: { userId: true },
        distinct: ["userId"]
      })

      const userIds = activeRecordings.map(r => r.userId)
      if (userIds.length === 0) return { triggered: false, message: "No active users to notify" }

      const remainingRec = (stats.recordings.remainingBytes / (1024 * 1024 * 1024)).toFixed(2)
      const remainingTrans = (stats.transcriptions.remainingBytes / (1024 * 1024 * 1024)).toFixed(2)

      await createManyNotifications(
        userIds.map(userId => ({
          userId,
          title: "Low Storage Space Warning ⚠️",
          content: `Platform storage space is low (Recordings: ${remainingRec} GB, Transcriptions: ${remainingTrans} GB). Please be careful.`,
          link: "/member"
        }))
      )

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

    await createAuditLog("MANUAL_STORAGE_CLEANUP", detailsText)

    revalidatePath("/admin/storage")
    return { success: true, count: expiredRecordings.length }
  } catch (error: any) {
    console.error("Admin cleanup error:", error)
    return { success: false, error: error.message }
  }
}
