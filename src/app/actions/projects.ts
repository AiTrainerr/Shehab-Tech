"use server"

import { prisma } from "@/lib/prisma"
import { uploadToSupabase } from "@/lib/storage"
import * as XLSX from "xlsx"

export async function createProjectAction(formData: FormData) {
  try {
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
    const requiredParticipants = parseInt(formData.get("requiredParticipants") as string) || 1
    const durationUnit = formData.get("durationUnit") as string || "HOUR"
    const pricingModel = formData.get("pricingModel") as string || "FIXED_PROJECT"
    const namingRule = formData.get("namingRule") as string || "SEQUENCE"

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
          namingRule,
          requiredParticipants,
          languages: { create: languages },
          images: { create: images }
        }
      })

      if (hasScript) {
        let sentences: string[] = []
        const scriptMode = formData.get("scriptMode") as string // "file" or "manual"

        if (scriptMode === "manual") {
          const manualScriptText = formData.get("manualScriptText") as string
          if (manualScriptText && manualScriptText.trim()) {
            sentences = manualScriptText
              .split("\n")
              .map(s => s.trim())
              .filter(Boolean)
          }
        } else {
          const file = formData.get("scriptFile") as File | null
          if (file && file.size > 0) {
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
              throw new Error("Unsupported script file format. Please upload XLSX, CSV, or TXT.")
            }
          }
        }

        if (sentences.length > 0) {
          await tx.projectSentence.createMany({
            data: sentences.map((text, i) => ({
              projectId: proj.id,
              text,
              order: i + 1
            }))
          })
        } else {
          throw new Error("Script configuration enabled, but no sentences could be parsed or found.")
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

export async function applyToProject(projectId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true, autoApprove: true } })
    if (!project) return { success: false, error: "Project not found" }

    const status = project.autoApprove ? "APPROVED" : "PENDING"

    await prisma.application.create({
      data: { projectId, userId: user.id, status }
    })
    
    if (project.autoApprove) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Application Auto-Approved!",
          content: `Your application for "${project.title}" has been automatically approved.`,
          link: `/member/projects/${projectId}`
        }
      })
    }
    
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
    const applicant = await prisma.user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } })
    
    if (admins.length > 0 && applicant) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: project.autoApprove ? "New Application (Auto-Approved)" : "New Application",
          content: `${applicant.firstName} ${applicant.lastName} applied for "${project.title}".`,
          link: `/profile/${user.id}`
        }))
      })
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Apply error:", error)
    if (error.code === 'P2002') return { success: false, error: "You have already applied." }
    return { success: false, error: "Failed to apply" }
  }
}

export async function approveApplication(applicationId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "APPROVED" },
      include: { project: true }
    })
    
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: "Application Approved!",
        content: `Your application for "${application.project.title}" has been approved.`
      }
    })
    
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/applications")
    revalidatePath(`/member/projects/${application.projectId}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("Approve application error:", error)
    return { success: false, error: "Failed to approve application" }
  }
}

export async function rejectApplication(applicationId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "REJECTED" },
      include: { project: true }
    })
    
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: "Application Status Update",
        content: `Your application for "${application.project.title}" was not selected.`
      }
    })
    
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
    const requiredParticipants = parseInt(formData.get("requiredParticipants") as string) || 1
    const hasScript = formData.get("hasScript") === "true"
    const scriptType = formData.get("scriptType") as string || "STATIC"
    const namingRule = formData.get("namingRule") as string || "SEQUENCE"

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
          namingRule,
          requiredParticipants
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

        if (scriptMode === "manual") {
          const manualScriptText = formData.get("manualScriptText") as string
          if (manualScriptText && manualScriptText.trim()) {
            sentences = manualScriptText
              .split("\n")
              .map(s => s.trim())
              .filter(Boolean)
          }
        } else {
          const file = formData.get("scriptFile") as File | null
          if (file && file.size > 0) {
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
              throw new Error("Unsupported script file format. Please upload XLSX, CSV, or TXT.")
            }
          }
        }

        if (sentences.length > 0) {
          await tx.projectSentence.deleteMany({ where: { projectId } })
          await tx.projectSentence.createMany({
            data: sentences.map((text, i) => ({
              projectId,
              text,
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

    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: "💰 Payout Released!",
        content: `Your payment for the project "${application.project.title}" has been processed and marked as paid.`
      }
    })

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
