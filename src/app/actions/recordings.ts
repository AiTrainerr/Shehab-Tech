"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { uploadAudioToCloudinary, deleteFromCloudinary, cloudinary } from "@/lib/cloudinary"
import { createAuditLog } from "@/app/actions/audit"
import { revalidatePath } from "next/cache"
import { createNotification, createManyNotifications } from "@/app/actions/notifications"
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

function getTransformedCloudinaryUrl(url: string, format: string, sampleRate?: number) {
  let transformedUrl = url
  
  // 1. Change extension at the end of the URL to match the target format
  const targetExt = format.toLowerCase()
  const lastDotIdx = transformedUrl.lastIndexOf(".")
  if (lastDotIdx !== -1) {
    transformedUrl = transformedUrl.substring(0, lastDotIdx) + "." + targetExt
  }
  
  // 2. Remove any existing af_xxx/ or ar_xxx/ transformation right after /upload/
  transformedUrl = transformedUrl.replace(/\/upload\/(af_\d+|ar_\d+)\//, "/upload/")

  // 3. Insert the new audio frequency transformation if sampleRate is provided
  if (sampleRate) {
    const uploadPattern = "/upload/"
    const uploadIdx = transformedUrl.indexOf(uploadPattern)
    if (uploadIdx !== -1) {
      const insertionPoint = uploadIdx + uploadPattern.length
      transformedUrl = 
        transformedUrl.substring(0, insertionPoint) + 
        `af_${sampleRate}/` + 
        transformedUrl.substring(insertionPoint)
    }
  }
  
  return transformedUrl
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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, age: true, gender: true }
    })
    
    const sentence = await prisma.projectSentence.findUnique({
      where: { id: sentenceId },
      select: { order: true, projectId: true }
    })

    if (!dbUser || !sentence) return { success: false, error: "User or Sentence not found" }

    const buffer = Buffer.from(await audioFile.arrayBuffer())
    
    // User folder: ID_FirstName_LastName_Age_Gender
    const ageStr = dbUser.age ? dbUser.age.toString() : 'N-A'
    const genderStr = dbUser.gender ? dbUser.gender : 'N-A'
    const folderName = `shehab-tech/recordings/${user.id}_${dbUser.firstName}_${dbUser.lastName}_${ageStr}_${genderStr}`
    
    // File name: FirstName_LastName_Sentence_Order
    const filename = `${dbUser.firstName}_${dbUser.lastName}_Sentence_${sentence.order}`

    const { url, publicId } = await uploadAudioToCloudinary(buffer, filename, folderName)

    const transformedUrl = getTransformedCloudinaryUrl(url, audioFormat, sampleRate)

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h expiration placeholder

    // Upsert recording metadata
    await prisma.voiceRecording.upsert({
      where: { sentenceId_userId: { sentenceId, userId: user.id } },
      create: {
        sentenceId,
        userId: user.id,
        fileUrl: transformedUrl,
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
        fileUrl: transformedUrl,
        publicId,
        expiresAt,
        status: "PENDING",
        fileSize,
        duration,
        audioFormat,
        sampleRate,
        bitDepth,
        channels,
        movedToCloud: false,
        rejectionReason: null
      }
    })

    // Log the file upload action
    await createAuditLog(
      "UPLOAD_RECORDING",
      `Uploaded recording for sentence ${sentenceId}. Format: ${audioFormat}, Sample Rate: ${sampleRate}Hz, Size: ${fileSize} bytes`
    )

    return { success: true, url: transformedUrl }
  } catch (e: any) {
    console.error("Upload recording error:", e)
    return { success: false, error: "Failed to upload recording: " + e.message }
  }
}

// ─── QC: Review / Approve / Reject Recording (single, no notification) ────
export async function reviewVoiceRecording(
  recordingId: string,
  status: "ACCEPTED" | "REJECTED" | "NEED_RE_RECORD",
  rejectionReason?: string
) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, firstName: true, lastName: true, canReviewQC: true } })
    const isAllowed = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN" || dbUser?.role === "QC_REVIEWER" || (dbUser?.role === "MODERATOR" && dbUser.canReviewQC)
    if (!isAllowed) {
      return { success: false, error: "Unauthorized" }
    }

    const reviewerName = `${dbUser?.firstName} ${dbUser?.lastName}`

    await prisma.voiceRecording.update({
      where: { id: recordingId },
      data: {
        status,
        rejectionReason: rejectionReason || null,
        reviewedBy: reviewerName
      }
    })

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

// ─── QC: Bulk Save All Decisions + Single Notification ────────────────────
export async function saveBulkReview(
  applicationId: string,
  decisions: { recordingId: string; status: "ACCEPTED" | "NEED_RE_RECORD" | "REJECTED"; reason?: string }[]
) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, firstName: true, lastName: true, canReviewQC: true }
    })
    const isAllowed = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN" || dbUser?.role === "QC_REVIEWER" || (dbUser?.role === "MODERATOR" && dbUser.canReviewQC)
    if (!isAllowed) {
      return { success: false, error: "Unauthorized" }
    }

    const reviewerName = `${dbUser?.firstName} ${dbUser?.lastName}`

    // Fetch the application to get userId & projectId
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true }
    })
    if (!application) return { success: false, error: "Application not found" }

    // Save all decisions in a single transaction (uses 1 connection)
    await prisma.$transaction(
      decisions.map((d) =>
        prisma.voiceRecording.update({
          where: { id: d.recordingId },
          data: {
            status: d.status,
            rejectionReason: d.reason || null,
            reviewedBy: reviewerName
          }
        })
      )
    )

    const rejectedCount = decisions.filter(d => d.status === "NEED_RE_RECORD" || d.status === "REJECTED").length
    const acceptedCount = decisions.filter(d => d.status === "ACCEPTED").length
    const allAccepted = rejectedCount === 0

    // Update application status
    if (allAccepted) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "FINAL_REVIEW" }
      })
    } else {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "WORKING" }
      })
    }

    // Send a single summary notification to the freelancer
    await createNotification(
      application.userId,
      allAccepted ? "🎉 Recordings Under Final Client Review!" : "📋 Review Completed – Action Required",
      allAccepted
        ? `All your recordings for "${application.project.title}" have been accepted by the reviewer and are now under final client review.`
        : `Reviewer completed the review for "${application.project.title}". ${acceptedCount} accepted, ${rejectedCount} require re-recording. Please check your project.`,
      `/member/projects/${application.projectId}`
    )

    await createAuditLog(
      "QC_BULK_REVIEW",
      `${reviewerName} completed bulk review for application ${applicationId}: ${acceptedCount} accepted, ${rejectedCount} rejected.`
    )

    revalidatePath(`/admin/applications/${applicationId}/review`)
    return { success: true, allAccepted }
  } catch (e: any) {
    console.error("Bulk review error:", e)
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

// ─── Freelancer: Submit all recordings for a project ──────────────────────────
export async function submitAllRecordings(projectId: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true }
    })
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true }
    })

    if (!dbUser || !project) return { success: false, error: "User or Project not found" }

    // Update the application status to "UNDER_REVIEW" if it's currently something else
    await prisma.application.updateMany({
      where: { projectId, userId: user.id },
      data: { status: "UNDER_REVIEW" }
    })

    // Fetch admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    const notificationsToCreate = admins.map(admin => ({
      userId: admin.id,
      title: `Recordings Submitted for ${project.title}`,
      content: `${dbUser.firstName} ${dbUser.lastName} has completed recording all sentences for this project. You can now download the files.`,
      link: `/admin/projects/edit/${projectId}`
    }))

    if (notificationsToCreate.length > 0) {
      await createManyNotifications(notificationsToCreate)
    }

    return { success: true }
  } catch (e: any) {
    console.error("Submit all recordings error:", e)
    return { success: false, error: e.message }
  }
}

// ─── Freelancer / Admin: Generate ZIP download URL ────────────────────────
export async function generateProjectZipUrl(projectId: string, targetUserId?: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const uid = targetUserId || user.id
    
    const dbUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { firstName: true, lastName: true, age: true, gender: true }
    })
    
    if (!dbUser) return { success: false, error: "User not found" }

    const ageStr = dbUser.age ? dbUser.age.toString() : 'N-A'
    const genderStr = dbUser.gender ? dbUser.gender : 'N-A'
    const folderName = `shehab-tech/recordings/${uid}_${dbUser.firstName}_${dbUser.lastName}_${ageStr}_${genderStr}`

    // Note: Cloudinary's generate_archive_url creates a signed URL for a zip.
    // It requires the API key/secret, so we must do it on the server.
    const zipUrl = cloudinary.utils.download_zip_url({
      prefixes: folderName,
      resource_type: "video" // Audio is stored as video in cloudinary
    })

    return { success: true, url: zipUrl }
  } catch (e: any) {
    console.error("ZIP Generation error:", e)
    return { success: false, error: e.message }
  }
}


// ─── Admin: Approve or Reject ALL Recordings ───────────────────────────────
export async function reviewAllRecordings(applicationId: string, action: "APPROVE_ALL" | "REJECT_ALL", reason?: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Unauthorized" }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true }
    })
    
    if (!application) return { success: false, error: "Application not found" }

    // Find all recordings by this user for this project
    const recordings = await prisma.voiceRecording.findMany({
      where: {
        userId: application.userId,
        sentence: { projectId: application.projectId }
      }
    })

    if (recordings.length === 0) return { success: false, error: "No recordings found" }

    if (action === "APPROVE_ALL") {
      await prisma.voiceRecording.updateMany({
        where: { id: { in: recordings.map(r => r.id) } },
        data: { status: "ACCEPTED", reviewedBy: user.id }
      })
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "APPROVED" }
      })
      
      await createNotification(
        application.userId,
        "Project Approved! 🎉",
        `Your recordings for ${application.project.title} have been fully approved.`,
        `/member/projects/${application.projectId}`
      )
    } else {
      await prisma.voiceRecording.updateMany({
        where: { id: { in: recordings.map(r => r.id) } },
        data: { status: "NEED_RE_RECORD", rejectionReason: reason || "Entire batch rejected.", reviewedBy: user.id }
      })
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "WORKING" } // Set to WORKING to let the freelancer re-record
      })
      
      await createNotification(
        application.userId,
        "Recordings Rejected",
        `All recordings for ${application.project.title} need to be re-recorded. Reason: ${reason || "Quality issues."}`,
        `/member/projects/${application.projectId}/record`
      )
    }

    revalidatePath(`/admin/applications/[id]/review`, "page")
    return { success: true }
  } catch (e: any) {
    console.error("Review all error:", e)
    return { success: false, error: e.message }
  }
}
