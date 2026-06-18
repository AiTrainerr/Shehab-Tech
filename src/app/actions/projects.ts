"use server"

import { prisma } from "@/lib/prisma"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { cookies } from "next/headers"

import { uploadToSupabase } from "@/lib/storage"

// saveFileLocally is no longer used for production, using uploadToSupabase instead

export async function createProjectAction(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const privateData = formData.get("privateData") as string || null
    const reqCountry = formData.get("reqCountry") as string || null
    const price = parseFloat(formData.get("price") as string) || 0
    const recordingDuration = formData.get("recordingDuration") ? parseFloat(formData.get("recordingDuration") as string) : null
    const reqAgeMin = formData.get("reqAgeMin") ? parseInt(formData.get("reqAgeMin") as string) : null
    const reqAgeMax = formData.get("reqAgeMax") ? parseInt(formData.get("reqAgeMax") as string) : null
    
    const langCount = parseInt(formData.get("langCount") as string) || 0
    const imageCount = parseInt(formData.get("imageCount") as string) || 0

    // Extract languages
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

    // Extract and save images
    const images = []
    for (let i = 0; i < imageCount; i++) {
      const imageFile = formData.get(`image_${i}`) as File | null
      const caption = formData.get(`caption_${i}`) as string | null
      
      if (imageFile && imageFile.size > 0) {
        const url = await uploadToSupabase(imageFile, 'projects')
        images.push({ url, caption })
      }
    }

    // Create project
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
        languages: {
          create: languages
        },
        images: {
          create: images
        }
      }
    })

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/admin/projects")
    revalidatePath("/member/projects")
    revalidatePath("/admin")
    revalidatePath("/member")

    return { success: true, projectId: project.id }
  } catch (error: any) {
    console.error("Create project error:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function applyToProject(projectId: string) {
  try {
    const supabase = await import("@/lib/supabase").then(m => m.createClientServer())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const application = await prisma.application.create({
      data: { projectId, userId: user.id }
    })
    
    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } })
    const applicant = await prisma.user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } })
    
    if (admins.length > 0 && project && applicant) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: "New Application",
          message: `${applicant.firstName} ${applicant.lastName} applied for "${project.title}".`
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
    
    // Update application
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "APPROVED" },
      include: { project: true }
    })
    
    // Notify user
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: "Application Approved!",
        message: `Your application for "${application.project.title}" has been approved.`
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
    
    // Update application
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "REJECTED" },
      include: { project: true }
    })
    
    // Notify user
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: "Application Status Update",
        message: `Your application for "${application.project.title}" was not selected.`
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
