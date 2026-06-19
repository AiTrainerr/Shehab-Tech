"use server"

import { prisma } from "@/lib/prisma"
import { uploadToSupabase } from "@/lib/storage"

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

    const languages = []
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

    const images = []
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

    const project = await prisma.project.create({
      data: {
        title,
        description,
        privateData,
        reqCountry,
        price,
        recordingDuration,
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
        requiredParticipants,
        languages: { create: languages },
        images: { create: images }
      }
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
    if (dbUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const privateData = formData.get("privateData") as string || null
    const reqCountry = formData.get("reqCountry") as string || null
    const price = parseFloat(formData.get("price") as string) || 0
    const recordingDuration = formData.get("recordingDuration") ? parseFloat(formData.get("recordingDuration") as string) : null
    const reqAgeMin = formData.get("reqAgeMin") ? parseInt(formData.get("reqAgeMin") as string) : null
    const reqAgeMax = formData.get("reqAgeMax") ? parseInt(formData.get("reqAgeMax") as string) : null
    const autoApprove = formData.get("autoApprove") === "true"

    await prisma.project.update({
      where: { id: projectId },
      data: { title, description, privateData, reqCountry, price, recordingDuration, reqAgeMin, reqAgeMax, autoApprove }
    })

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects")
    revalidatePath(`/admin/projects/edit/${projectId}`)
    revalidatePath("/member/projects")
    
    return { success: true }
  } catch (error: any) {
    console.error("Update project error:", error)
    return { success: false, error: "Failed to update project" }
  }
}
