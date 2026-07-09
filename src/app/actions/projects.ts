"use server"

import { prisma } from "@/lib/prisma"
import { uploadToSupabase } from "@/lib/storage"
import * as XLSX from "xlsx"
import { createNotification, createManyNotifications } from "@/app/actions/notifications"
import { deleteFromCloudinary } from "@/lib/cloudinary"

function colToIndex(col: string | null): number | null {
  if (!col) return null;
  const upper = col.toUpperCase().trim();
  if (!/^[A-Z]+$/.test(upper)) {
    const parsed = parseInt(upper);
    return isNaN(parsed) ? null : parsed;
  }
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

export async function createProjectAction(formData: FormData) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized. Only admins can publish projects." }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const privateData = formData.get("privateData") as string || null
    // reqCountry can be a single country string or JSON array of countries
    const reqCountry = formData.get("reqCountry") as string || null
    const price = parseFloat(formData.get("price") as string) || 0
    const recordingDuration = formData.get("recordingDuration") ? parseFloat(formData.get("recordingDuration") as string) : null
    const reqAgeMin = formData.get("reqAgeMin") ? parseInt(formData.get("reqAgeMin") as string) : null
    const reqAgeMax = formData.get("reqAgeMax") ? parseInt(formData.get("reqAgeMax") as string) : null
    const autoApprove = formData.get("autoApprove") === "true"
    
    const langCount = parseInt(formData.get("langCount") as string) || 0
    const imageCount = parseInt(formData.get("imageCount") as string) || 0

    const languages: { language: string; dialect: string | null; proficiency: string | null }[] = []
    for (let i = 0; i < langCount; i++) {
      const language = formData.get(`language_${i}`) as string
      if (language) {
        languages.push({
          language,
          dialect: formData.get(`dialect_${i}`) as string || null,
          proficiency: formData.get(`proficiency_${i}`) as string || null
        })
      }
    }

    const images: { url: string; caption: string | null }[] = []
    for (let i = 0; i < imageCount; i++) {
      const imageFile = formData.get(`image_${i}`) as File | null
      const caption = formData.get(`caption_${i}`) as string | null
      if (imageFile && imageFile.size > 0) {
        const url = await uploadToSupabase(imageFile, 'projects')
        images.push({ url, caption })
      }
    }

    const executionOption = formData.get("executionOption") as string || "INTERNAL"
    const externalUrl = formData.get("externalUrl") as string || null
    const audioFormat = formData.get("audioFormat") as string || "WAV"
    const sampleRate = parseInt(formData.get("sampleRate") as string) || 44100
    const bitDepth = parseInt(formData.get("bitDepth") as string) || 16
    const channels = formData.get("channels") as string || "MONO"
    const minDuration = formData.get("minDuration") ? parseInt(formData.get("minDuration") as string) : null
    const maxDuration = formData.get("maxDuration") ? parseInt(formData.get("maxDuration") as string) : null
    const hasScript = formData.get("hasScript") === "true"
    const scriptType = formData.get("scriptType") as string || "STATIC"
    const sentencesPerUser = formData.get("sentencesPerUser") ? parseInt(formData.get("sentencesPerUser") as string) : null
    const isTranscriptionProject = formData.get("isTranscriptionProject") === "true"
    const workflowType = formData.get("workflowType") as string || "MOD_ONLY"
    const outputFormat = formData.get("outputFormat") as string || "WORD"
    const targetMales = parseInt(formData.get("targetMales") as string) || 0
    const targetFemales = parseInt(formData.get("targetFemales") as string) || 0
    const reqParticipantsInput = parseInt(formData.get("requiredParticipants") as string) || 0
    const requiredParticipants = Math.max(reqParticipantsInput, targetMales + targetFemales)
    const durationUnit = formData.get("durationUnit") as string || "HOUR"
    const pricingModel = formData.get("pricingModel") as string || "FIXED_PROJECT"
    const namingRule = formData.get("namingRule") as string || "SEQUENCE"
    const zipNamingRule = formData.get("zipNamingRule") as string || "FULL"
    const timeLimitStr = formData.get("timeLimitHours") as string
    const timeLimitHours = timeLimitStr ? parseInt(timeLimitStr) : null
    const enableNoiseCancellation = formData.get("enableNoiseCancellation") === "true"
    const customFileNaming = formData.get("customFileNaming") as string || null

    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          title,
          description,
          privateData,
          reqCountry,
          price,
          recordingDuration,
          durationUnit,
          pricingModel,
          reqAgeMin,
          reqAgeMax,
          autoApprove,
          executionOption,
          externalUrl,
          audioFormat,
          sampleRate,
          bitDepth,
          channels,
          minDuration,
          maxDuration,
          hasScript,
          scriptType,
          sentencesPerUser,
          namingRule,
          zipNamingRule,
          customFileNaming,
          timeLimitHours,
          enableNoiseCancellation,
          requiredParticipants,
          targetMales,
          targetFemales,
          isTranscriptionProject,
          workflowType,
          outputFormat,
          languages: { create: languages },
          images: { create: images }
        }
      })

      if (!isTranscriptionProject && hasScript) {
        // Can be either an array of strings (for STATIC/DYNAMIC_POOL) or array of objects (for PRE_ASSIGNED)
        let parsedSentences: any[] = []
        const scriptMode = formData.get("scriptMode") as string // "file" or "manual"
        
        const sentenceColIdx = colToIndex(formData.get("sentenceCol") as string);
        const idColIdx = colToIndex(formData.get("idCol") as string);
        const noteColIdx = colToIndex(formData.get("noteCol") as string);

        if (scriptMode === "manual" && scriptType !== "PRE_ASSIGNED") {
          const manualScriptText = formData.get("manualScriptText") as string
          if (manualScriptText && manualScriptText.trim()) {
            parsedSentences = manualScriptText
              .split("\n")
              .map(s => ({ text: s.trim() }))
              .filter(s => s.text)
          }
        } else {
          const file = formData.get("scriptFile") as File | null
          if (file && file.size > 0) {
            const name = file.name.toLowerCase()
            const buffer = Buffer.from(await file.arrayBuffer())

            if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
              const workbook = XLSX.read(buffer, { type: "buffer" })
              let allSentences: any[] = []
              
              const firstSheetName = workbook.SheetNames[0]
              if (firstSheetName) {
                const sheet = workbook.Sheets[firstSheetName]
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
                
                if (scriptType === "PRE_ASSIGNED") {
                  const sheetSentences = rows
                    .map((row: any[]) => {
                      if (row.length >= 2 && row[0] && row[1]) {
                        return { text: String(row[0]).trim(), assignedEmail: String(row[1]).trim() }
                      }
                      return null
                    })
                    .filter(Boolean)
                  allSentences = [...allSentences, ...sheetSentences]
                } else {
                  const sheetSentences = rows
                    .map((row: any[]) => {
                      if (sentenceColIdx !== null && row[sentenceColIdx]) {
                        const text = String(row[sentenceColIdx]).trim();
                        if (!text) return null;
                        const audioId = idColIdx !== null && row[idColIdx] ? String(row[idColIdx]).trim() : undefined;
                        const note = noteColIdx !== null && row[noteColIdx] ? String(row[noteColIdx]).trim() : undefined;
                        return { text, audioId, note };
                      } else if (sentenceColIdx === null) {
                        for (const cell of row) {
                          if (cell !== undefined && cell !== null && String(cell).trim()) {
                            return { text: String(cell).trim() }
                          }
                        }
                      }
                        return null
                      })
                      .filter(Boolean)
                    allSentences = [...allSentences, ...sheetSentences]
                  }
              }
              parsedSentences = allSentences
            } else if (name.endsWith(".txt") && scriptType !== "PRE_ASSIGNED") {
              const text = buffer.toString("utf-8")
              parsedSentences = text
                .split("\n")
                .map(s => s.trim())
                .filter(Boolean)
            } else {
              throw new Error("Unsupported script file format for the chosen distribution method.")
            }
          }
        }

        if (parsedSentences.length > 0) {
          await tx.projectSentence.createMany({
            data: parsedSentences.map((item, i) => {
              return {
                projectId: proj.id,
                text: item.text,
                audioId: item.audioId || null,
                note: item.note || null,
                assignedEmail: item.assignedEmail || null,
                order: i + 1
              }
            })
          })
        } else {
          throw new Error("Script configuration enabled, but no sentences could be parsed or found.")
        }
      } else if (isTranscriptionProject) {
        // Try parsing preUploadedAudio first
        const preUploadedAudio = formData.get("preUploadedAudio") as string
        const audioUploads: any[] = []

        if (preUploadedAudio) {
          const parsed = JSON.parse(preUploadedAudio) as { url: string, name: string }[]
          for (const item of parsed) {
            audioUploads.push({
              projectId: proj.id,
              audioFilePath: item.url,
              duration: null,
              speakerCount: 1,
              status: "AVAILABLE",
            })
          }
        } else {
          // Fallback to traditional upload if any
          const files = formData.getAll("transcriptionFiles") as File[]
          const validFiles = files.filter(f => f && f.size > 0)
          
          if (validFiles.length > 0) {
            for (const file of validFiles) {
              const url = await uploadToSupabase(file, 'transcription')
              audioUploads.push({
                projectId: proj.id,
                audioFilePath: url,
                duration: null, // optionally could be parsed if we had an audio parser
                speakerCount: 1,
                status: "AVAILABLE",
              })
            }
          }
        }
        
        if (audioUploads.length > 0) {
          await tx.transcriptionTask.createMany({
            data: audioUploads
          })
        }
      }

      return proj
    })

    const { createAuditLog } = await import("@/app/actions/audit")
    await createAuditLog("CREATE_PROJECT", `Created project "${title}" (${project.id}) with execution option ${executionOption}`)

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects")
    revalidatePath("/member/projects")
    revalidatePath("/admin")
    revalidatePath("/member")

    return { success: true, projectId: project.id }
  } catch (error: any) {
    console.error("Create project error:", error)
    return { success: false, error: "Failed to create project: " + error.message }
  }
}

export async function applyToProject(projectId: string, applicationType: "FREELANCER" | "TEAM_LEADER" = "FREELANCER") {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return { success: false, error: "Project not found" }

    const applicant = await prisma.user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true, gender: true } })
    if (!applicant) return { success: false, error: "User profile not found" }

    // Enforce Gender Targets
    if ((project.targetMales > 0 && applicant.gender === 'male') || (project.targetFemales > 0 && applicant.gender === 'female')) {
      const target = applicant.gender === 'male' ? project.targetMales : project.targetFemales;
      
      const currentCount = await prisma.application.count({
        where: {
          projectId,
          status: { notIn: ['REJECTED'] },
          user: { gender: applicant.gender }
        }
      });
      
      if (currentCount >= target) {
        return { 
          success: false, 
          error: `Ø¹Ø°Ø±Ø§Ù‹ØŒ Ù„Ù‚Ø¯ Ø§ÙƒØªÙ…Ù„ Ø§Ù„Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ù„Ù€ ${applicant.gender === 'male' ? 'Ø§Ù„Ø°ÙƒÙˆØ±' : 'Ø§Ù„Ø¥Ù†Ø§Ø«'} ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹.` 
        }
      }
    }

    const status = project.autoApprove ? "ACCEPTED" : "PENDING"

    await prisma.application.create({
      data: { projectId, userId: user.id, status, applicationType }
    })
    
    if (project.autoApprove) {
      await createNotification(
        user.id,
        "Application Auto-Approved!",
        `Your application for "${project.title}" has been automatically approved.`,
        `/member/projects/${projectId}`
      )
    }
    
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
    
    if (admins.length > 0 && applicant) {
      await createManyNotifications(
        admins.map(admin => ({
          userId: admin.id,
          title: project.autoApprove ? "New Application (Auto-Approved)" : "New Application",
          content: `${applicant.firstName} ${applicant.lastName} applied for "${project.title}".`,
          link: `/profile/${user.id}`
        }))
      )
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Apply error:", error)
    if (error.code === 'P2002') return { success: false, error: "You have already applied." }
    return { success: false, error: "Failed to apply" }
  }
}

export async function promoteToQC(applicationId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Check if admin/mod
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && currentUser?.role !== "MODERATOR") {
      return { success: false, error: "Unauthorized" }
    }

    const app = await prisma.application.update({
      where: { id: applicationId },
      data: { projectRole: "QC", status: "ACCEPTED" }, // Promote and accept
      include: { project: { select: { title: true } } }
    })

    await createNotification(
      app.userId,
      "Promoted to QC ðŸŽ‰",
      `You have been promoted to Quality Control (QC) for project "${app.project.title}".`,
      `/member/projects/${app.projectId}`
    )

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/applications")

    return { success: true }
  } catch (error: any) {
    console.error("Promote to QC error:", error)
    return { success: false, error: "Failed to promote to QC" }
  }
}

export async function approveApplication(applicationId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const currentApp = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true, projectId: true, speakerCode: true }
    })

    if (!currentApp) return { success: false, error: "Application not found" }
    
    // Attempt to free any expired tasks before we assign one
    await releaseExpiredApplications(currentApp.projectId);

    let newStatus = "ACCEPTED";
    if (currentApp.status === "FINAL_REVIEW") {
      newStatus = "APPROVED";
    } else if (currentApp.status === "UNDER_REVIEW") {
      newStatus = "FINAL_REVIEW";
    }
    let speakerCode = currentApp.speakerCode;

    // We assign a speaker code as soon as they are ACCEPTED to start working
    if (newStatus === "ACCEPTED" && !speakerCode) {
      speakerCode = await prisma.$transaction(async (tx) => {
        // Lock the project row to serialize parallel approvals
        await tx.$executeRaw`SELECT id FROM "Project" WHERE id = ${currentApp.projectId} FOR UPDATE`;

        const batchSentences = await tx.projectSentence.findMany({
          where: { projectId: currentApp.projectId, speakerCode: { not: null } },
          select: { speakerCode: true },
          distinct: ['speakerCode']
        });

        if (batchSentences.length > 0) {
          const allBatchCodes = batchSentences.map(s => s.speakerCode);
          const assignedApps = await tx.application.findMany({
            where: {
              projectId: currentApp.projectId,
              speakerCode: { not: null }
            },
            select: { speakerCode: true }
          });

          const assignedSentences = await tx.projectSentence.findMany({
            where: {
              projectId: currentApp.projectId,
              assignedUserId: { not: null },
              speakerCode: { not: null }
            },
            select: { speakerCode: true }
          });

          const assignedCodes = [
            ...assignedApps.map(a => a.speakerCode),
            ...assignedSentences.map(s => s.speakerCode)
          ];

          const availableCode = allBatchCodes.find(code => !assignedCodes.includes(code));
          return availableCode || `NO_CODE_AVAILABLE_TEMP_${Date.now()}`;
        } else {
          const lastApp = await tx.application.findFirst({
            where: {
              projectId: currentApp.projectId,
              speakerCode: { not: null }
            },
            orderBy: { speakerCode: 'desc' }
          });

          let nextNumber = 1;
          if (lastApp && lastApp.speakerCode) {
            const match = lastApp.speakerCode.match(/G(\d+)/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }
          return `G${nextNumber.toString().padStart(4, '0')}`;
        }
      });
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus, speakerCode: speakerCode },
      include: { project: true }
    })
    
    await createNotification(
      application.userId,
      newStatus === "APPROVED" ? "ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø¹Ù…Ù„Ùƒ!" : "ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø·Ù„Ø¨Ùƒ!",
      newStatus === "APPROVED" 
        ? `ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø¹Ù…Ù„Ùƒ ÙÙŠ "${application.project.title}". ÙƒÙˆØ¯Ùƒ Ù‡Ùˆ ${speakerCode}.`
        : `ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø·Ù„Ø¨Ùƒ Ù„Ù€ "${application.project.title}". Ø§Ø¶ØºØ· Ù„Ù„Ø¨Ø¯Ø¡!`,
      `/member/projects/${application.projectId}`
    )
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/applications")
    revalidatePath(`/member/projects/${application.projectId}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("Approve application error:", error)
    return { success: false, error: "Failed to approve application" }
  }
}

export async function rejectApplication(applicationId: string, reason?: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true }
    })
    
    if (!application) return { success: false, error: "Application not found" }

    // Delete their recordings for this project so they can start fresh
    const projectSentences = await prisma.projectSentence.findMany({
      where: { projectId: application.projectId },
      select: { id: true }
    })
    
    const recordingsToDelete = await prisma.voiceRecording.findMany({
      where: {
        userId: application.userId,
        sentenceId: { in: projectSentences.map(s => s.id) }
      }
    })

    for (const rec of recordingsToDelete) {
      await deleteFromCloudinary(rec.publicId, rec.fileUrl)
    }

    await prisma.voiceRecording.deleteMany({
      where: {
        id: { in: recordingsToDelete.map(r => r.id) }
      }
    })

    // âœ… Release the sentences assigned to this user so the file is available for someone else
    await prisma.projectSentence.updateMany({
      where: {
        projectId: application.projectId,
        assignedUserId: application.userId
      },
      data: { assignedUserId: null }
    })

    // Delete the application completely
    await prisma.application.delete({
      where: { id: applicationId }
    })
    
    const content = reason 
      ? `Your application for "${application.project.title}" was not selected. Reason: ${reason}`
      : `Your application for "${application.project.title}" was not selected.`

    await createNotification(
      application.userId,
      "Application Status Update",
      content
    )
    
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/applications")
    revalidatePath(`/member/projects/${application.projectId}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("Reject application error:", error)
    return { success: false, error: "Failed to reject application" }
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    await prisma.project.update({
      where: { id: projectId },
      data: { status }
    })
    
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects")
    revalidatePath("/member/projects")
    
    return { success: true }
  } catch (error: any) {
    console.error("Update status error:", error)
    return { success: false, error: "Failed to update status" }
  }
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const privateData = formData.get("privateData") as string || null
    const reqCountry = formData.get("reqCountry") as string || null
    const price = parseFloat(formData.get("price") as string) || 0
    const recordingDuration = formData.get("recordingDuration") ? parseFloat(formData.get("recordingDuration") as string) : null
    const durationUnit = formData.get("durationUnit") as string || "HOUR"
    const pricingModel = formData.get("pricingModel") as string || "FIXED_PROJECT"
    const reqAgeMin = formData.get("reqAgeMin") ? parseInt(formData.get("reqAgeMin") as string) : null
    const reqAgeMax = formData.get("reqAgeMax") ? parseInt(formData.get("reqAgeMax") as string) : null
    const autoApprove = formData.get("autoApprove") === "true"

    const status = formData.get("status") as string || "OPEN"
    const executionOption = formData.get("executionOption") as string || "INTERNAL"
    const externalUrl = formData.get("externalUrl") as string || null
    const audioFormat = formData.get("audioFormat") as string || "WAV"
    const sampleRate = parseInt(formData.get("sampleRate") as string) || 44100
    const bitDepth = parseInt(formData.get("bitDepth") as string) || 16
    const channels = formData.get("channels") as string || "MONO"
    const minDuration = formData.get("minDuration") ? parseInt(formData.get("minDuration") as string) : null
    const maxDuration = formData.get("maxDuration") ? parseInt(formData.get("maxDuration") as string) : null
    const targetMales = parseInt(formData.get("targetMales") as string) || 0
    const targetFemales = parseInt(formData.get("targetFemales") as string) || 0
    const reqParticipantsInput = parseInt(formData.get("requiredParticipants") as string) || 0
    const requiredParticipants = Math.max(reqParticipantsInput, targetMales + targetFemales)
    const hasScript = formData.get("hasScript") === "true"
    const scriptType = formData.get("scriptType") as string || "STATIC"
    const sentencesPerUserStr = formData.get("sentencesPerUser") as string
    const sentencesPerUser = sentencesPerUserStr ? parseInt(sentencesPerUserStr) : null
    const namingRule = formData.get("namingRule") as string || "SEQUENCE"
    const zipNamingRule = formData.get("zipNamingRule") as string || "FULL"
    const timeLimitStr = formData.get("timeLimitHours") as string
    const timeLimitHours = timeLimitStr ? parseInt(timeLimitStr) : null
    const enableNoiseCancellation = formData.get("enableNoiseCancellation") === "true"
    const customFileNaming = formData.get("customFileNaming") as string || null

    // Parse languages
    const langCount = parseInt(formData.get("langCount") as string) || 0
    const languages: { language: string; dialect: string | null; proficiency: string | null }[] = []
    for (let i = 0; i < langCount; i++) {
      const language = formData.get(`language_${i}`) as string
      if (language) {
        languages.push({
          language,
          dialect: formData.get(`dialect_${i}`) as string || null,
          proficiency: formData.get(`proficiency_${i}`) as string || null
        })
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          title,
          description,
          privateData,
          reqCountry,
          price,
          recordingDuration,
          durationUnit,
          pricingModel,
          reqAgeMin,
          reqAgeMax,
          autoApprove,
          status,
          executionOption,
          externalUrl,
          audioFormat,
          sampleRate,
          bitDepth,
          channels,
          minDuration,
          maxDuration,
          hasScript,
          scriptType,
          sentencesPerUser,
          namingRule,
          zipNamingRule,
          customFileNaming,
          timeLimitHours,
          enableNoiseCancellation,
          requiredParticipants,
          targetMales,
          targetFemales
        }
      })

      // Re-create languages
      await tx.projectLanguage.deleteMany({ where: { projectId } })
      if (languages.length > 0) {
        await tx.projectLanguage.createMany({
          data: languages.map(l => ({
            projectId,
            ...l
          }))
        })
      }

      // Handle optional script update
      const updateScript = formData.get("updateScript") === "true"
      if (updateScript && hasScript) {
        let sentences: string[] = []
        const scriptMode = formData.get("scriptMode") as string
        
        const sentenceColIdx = colToIndex(formData.get("sentenceCol") as string);
        const idColIdx = colToIndex(formData.get("idCol") as string);
        const noteColIdx = colToIndex(formData.get("noteCol") as string);

        if (scriptMode === "manual") {
          const manualScriptText = formData.get("manualScriptText") as string
          if (manualScriptText && manualScriptText.trim()) {
            sentences = manualScriptText
              .split("\n")
              .map(s => ({ text: s.trim() }))
              .filter(s => s.text)
          }
        } else {
          const file = formData.get("scriptFile") as File | null
          if (file && file.size > 0) {
            const name = file.name.toLowerCase()
            const buffer = Buffer.from(await file.arrayBuffer())

            if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
              const workbook = XLSX.read(buffer, { type: "buffer" })
              let allSentences: any[] = []
              
              const firstSheetName = workbook.SheetNames[0]
              if (firstSheetName) {
                const sheet = workbook.Sheets[firstSheetName]
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

                const sheetSentences = rows
                  .map((row: any[]) => {
                    if (sentenceColIdx !== null && row[sentenceColIdx]) {
                      const text = String(row[sentenceColIdx]).trim();
                      if (!text) return null;
                      const audioId = idColIdx !== null && row[idColIdx] ? String(row[idColIdx]).trim() : undefined;
                      const note = noteColIdx !== null && row[noteColIdx] ? String(row[noteColIdx]).trim() : undefined;
                      return { text, audioId, note };
                    } else if (sentenceColIdx === null) {
                      for (const cell of row) {
                        if (cell !== undefined && cell !== null && String(cell).trim()) {
                          return { text: String(cell).trim() }
                        }
                      }
                    }
                    return null
                  })
                  .filter(Boolean)
                  
                allSentences = [...allSentences, ...sheetSentences]
              }
              
              sentences = allSentences
            } else if (name.endsWith(".txt")) {
              const text = buffer.toString("utf-8")
              sentences = text
                .split("\n")
                .map(s => s.trim())
                .filter(Boolean)
            } else {
              throw new Error("Unsupported script file format. Please upload XLSX, CSV, or TXT.")
            }
          }
        }

        if (sentences.length > 0) {
          await tx.projectSentence.deleteMany({ where: { projectId } })
          await tx.projectSentence.createMany({
            data: sentences.map((item: any, i) => ({
              projectId,
              text: item.text,
              audioId: item.audioId || null,
              note: item.note || null,
              order: i + 1
            }))
          })
        }
      }
    })

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects")
    revalidatePath(`/admin/projects/edit/${projectId}`)
    revalidatePath("/member/projects")
    
    return { success: true }
  } catch (error: any) {
    console.error("Update project error:", error)
    return { success: false, error: "Failed to update project: " + error.message }
  }
}

export async function markApplicationPaid(applicationId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Fetch user details for role validation
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "PAID" },
      include: { project: true }
    })

    await createNotification(
      application.userId,
      "ðŸ’° Payout Released!",
      `Your payment for the project "${application.project.title}" has been processed and marked as paid.`
    )

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/payments")
    revalidatePath("/admin/applications")
    revalidatePath(`/member/projects/${application.projectId}`)
    revalidatePath("/member")

    return { success: true }
  } catch (error: any) {
    console.error("Mark application paid error:", error)
    return { success: false, error: "Failed to mark application as paid" }
  }
}

export async function submitApplicationProof(applicationId: string, proofUrl: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    await prisma.application.update({
      where: { id: applicationId },
      data: { 
        proofUrl, 
        status: "UNDER_REVIEW"
      }
    })
    
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/member/projects")
    revalidatePath("/admin/applications")
    return { success: true }
  } catch (error: any) {
    console.error("Proof submission error:", error)
    return { success: false, error: "Failed to submit proof" }
  }
}

export async function releaseIncompleteSentences(projectId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Fetch user details for role validation
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Find all sentences in this project that are assigned to someone
    const assignedSentences = await prisma.projectSentence.findMany({
      where: {
        projectId,
        assignedUserId: { not: null }
      },
      include: {
        recordings: true
      }
    })

    let releasedCount = 0

    // For each sentence, check if there's any ACCEPTED or PENDING recording
    for (const sentence of assignedSentences) {
      const hasValidRecording = sentence.recordings.some(
        r => r.status === "ACCEPTED" || r.status === "PENDING"
      )

      if (!hasValidRecording) {
        // Release it back to the pool
        await prisma.projectSentence.update({
          where: { id: sentence.id },
          data: { assignedUserId: null }
        })
        releasedCount++
      }
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath(`/admin/projects/edit/${projectId}`)

    return { success: true, releasedCount }
  } catch (error: any) {
    console.error("Release sentences error:", error)
    return { success: false, error: "Failed to release sentences: " + error.message }
  }
}

export async function uploadBatchScripts(projectId: string, data: { speakerCode: string, audioId: string, text: string, speed: string }[]) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Check if admin
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return { success: false, error: "Project not found" }

    await prisma.$transaction(async (tx) => {
      // First, get the current max order
      const lastSentence = await tx.projectSentence.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' }
      })
      let currentOrder = lastSentence?.order || 0

      let filteredData = data;
      const incomingCodes = Array.from(new Set(data.map(item => item.speakerCode).filter(Boolean)));
      if (incomingCodes.length > 0) {
        const existingCodes = await tx.projectSentence.findMany({
          where: {
            projectId,
            speakerCode: { in: incomingCodes }
          },
          select: { speakerCode: true },
          distinct: ['speakerCode']
        });
        
        if (existingCodes.length > 0) {
          const dupes = new Set(existingCodes.map(c => c.speakerCode));
          filteredData = data.filter(item => !dupes.has(item.speakerCode));
        }
      }

      if (filteredData.length === 0) {
        return; // Nothing new to create
      }

      // Create new sentences
      const sentencesToCreate = filteredData.map(item => {
        currentOrder++
        return {
          projectId,
          text: item.text,
          speakerCode: item.speakerCode,
          audioId: item.audioId,
          speed: item.speed,
          order: currentOrder
        }
      })

      await tx.projectSentence.createMany({
        data: sentencesToCreate
      })
    })

    const { revalidatePath } = await import("next/cache")
    revalidatePath(`/admin/projects/edit/${projectId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Upload batch scripts error:", error)
    return { success: false, error: "Failed to upload scripts: " + error.message }
  }
}

export async function releaseExpiredApplications(projectId: string) {
  try {
    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      select: { timeLimitHours: true } 
    });
    
    if (!project || !project.timeLimitHours) return { success: true, count: 0 };
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - project.timeLimitHours);

    // Find applications that were APPROVED or ACCEPTED and haven't moved to SUBMITTED
    // and their updatedAt is older than the time limit
    const expiredApps = await prisma.application.findMany({
      where: {
        projectId,
        status: { in: ["APPROVED", "ACCEPTED"] },
        updatedAt: { lt: cutoffTime }
      },
      select: { id: true, userId: true, speakerCode: true }
    });

    if (expiredApps.length === 0) return { success: true, count: 0 };

    // Release them
    for (const app of expiredApps) {
      await prisma.application.update({
        where: { id: app.id },
        data: { 
          status: "REJECTED", // or EXPIRED if we add it, but REJECTED is fine to force them to reapply or fail
          speakerCode: null
        }
      });
      // Optionally notify
      await createNotification(
        app.userId,
        "Task Expired â³",
        `Your task for project has expired because you didn't complete it within ${project.timeLimitHours} hours.`
      ).catch(() => {}); // silent fail if user lookup fails
    }

    return { success: true, count: expiredApps.length };
  } catch (error) {
    console.error("Release expired applications error:", error);
    return { success: false, error: "Failed to release" };
  }
}

export async function getBatchCodesStatus(projectId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Check if admin
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const sentences = await prisma.projectSentence.findMany({
      where: { projectId, speakerCode: { not: null } },
      select: { speakerCode: true },
      distinct: ['speakerCode']
    })
    
    const codes = sentences.map(s => s.speakerCode as string)
    
    const apps = await prisma.application.findMany({
      where: { projectId, speakerCode: { in: codes } },
      select: { speakerCode: true, status: true, user: { select: { email: true, firstName: true, lastName: true } } }
    })
    
    const data = codes.map(code => {
      // Prioritize active apps
      const codeApps = apps.filter(a => a.speakerCode === code)
      const app = codeApps.find(a => a.status !== "REJECTED") || codeApps[0]
      const fullName = app ? `${app.user.firstName} ${app.user.lastName || ''}`.trim() : null
      return {
        speakerCode: code,
        assignedUser: app ? (fullName || app.user.email) : null,
        status: app ? app.status : 'UNASSIGNED'
      }
    })
    
    // Sort by status, UNASSIGNED first, then others
    data.sort((a, b) => {
      if (a.status === 'UNASSIGNED' && b.status !== 'UNASSIGNED') return -1;
      if (a.status !== 'UNASSIGNED' && b.status === 'UNASSIGNED') return 1;
      return a.speakerCode.localeCompare(b.speakerCode);
    });

    return { success: true, data }
  } catch (error: any) {
    console.error("Get batch codes status error:", error)
    return { success: false, error: "Failed to get batch codes status" }
  }
}

export async function deleteBatchCode(projectId: string, speakerCode: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Check if admin
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }
    
    const activeApp = await prisma.application.findFirst({
       where: { projectId, speakerCode, status: { notIn: ["REJECTED"] } }
    })
    
    if (activeApp) {
      return { success: false, error: "Cannot delete code while it is actively assigned to a user. Please reject or cancel their application first." }
    }
    
    await prisma.projectSentence.deleteMany({
       where: { projectId, speakerCode }
    })
    
    return { success: true }
  } catch (error: any) {
    console.error("Delete batch code error:", error)
    return { success: false, error: "Failed to delete batch code" }
  }
}

export async function addTranscriptionTasks(projectId: string, tasks: { audioFilePath: string }[]) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }
    
    if (tasks.length > 0) {
      const data = tasks.map(t => ({
        projectId,
        audioFilePath: t.audioFilePath,
        speakerCount: 1,
        status: "AVAILABLE"
      }))
      await prisma.transcriptionTask.createMany({ data })
    }
    
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects/edit-transcription/" + projectId)
    revalidatePath("/admin/projects")
    
    return { success: true }
  } catch (error: any) {
    console.error("Add transcription tasks error:", error)
    return { success: false, error: "Failed to add transcription tasks" }
  }
}


export async function deleteProjectAction(projectId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.$transaction([
      prisma.application.deleteMany({ where: { projectId } }),
      prisma.comment.deleteMany({ where: { projectId } }),
      prisma.project.delete({ where: { id: projectId } })
    ])
    
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects")
    
    return { success: true }
  } catch (error: any) {
    console.error("Delete project error:", error)
    return { success: false, error: "Failed to delete project: " + error.message }
  }
}



export async function deleteApplication(applicationId: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: "Unauthorized" }
    const admin = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!admin || !["ADMIN", "SUPERADMIN"].includes(admin.role)) return { success: false, error: "Forbidden" }

    const app = await prisma.application.findUnique({ where: { id: applicationId } })
    if (!app) return { success: false, error: "Application not found" }

    await prisma.projectSentence.updateMany({ where: { projectId: app.projectId, assignedUserId: app.userId }, data: { assignedUserId: null } })
    await prisma.application.delete({ where: { id: applicationId } })
    return { success: true }
  } catch (error: any) {
    console.error("delete application error:", error)
    return { success: false, error: "Failed to delete" }
  }
}

export async function extendApplicationTime(applicationId: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const admin = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    if (!admin || !["ADMIN", "SUPERADMIN"].includes(admin.role)) return { success: false, error: "Forbidden" }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true }
    })
    if (!app) return { success: false, error: "Application not found" }

    if (app.project.scriptType === "DYNAMIC_POOL" && app.project.sentencesPerUser) {
      // Check how many sentences the user already has assigned
      const currentAssigned = await prisma.projectSentence.count({
        where: { projectId: app.projectId, assignedUserId: app.userId }
      })

      const needed = app.project.sentencesPerUser - currentAssigned

      if (needed > 0) {
        // Find unassigned sentences
        const unassigned = await prisma.projectSentence.findMany({
          where: { projectId: app.projectId, assignedUserId: null },
          take: needed,
          orderBy: { order: "asc" }
        })

        if (unassigned.length < needed) {
          return { success: false, error: "?? ???? ?????? ????? ??? ?????? ?????? ?????. ??????: " + unassigned.length }
        }

        // Assign them to the user
        const unassignedIds = unassigned.map(s => s.id)
        await prisma.projectSentence.updateMany({
          where: { id: { in: unassignedIds } },
          data: { assignedUserId: app.userId }
        })
      }
    }

    // Update application
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "WORKING",
        updatedAt: new Date() // Reset the timeout clock
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("extend time error:", error)
    return { success: false, error: "Failed to extend time" }
  }
}

