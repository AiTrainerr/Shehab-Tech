"use server"

import { prisma } from "@/lib/prisma"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { cookies } from "next/headers"

// Helper to save a file locally
async function saveFileLocally(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const ext = path.extname(file.name) || ".jpg"
  const fileName = `${crypto.randomBytes(16).toString("hex")}${ext}`
  
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  
  try {
    await fs.access(uploadDir)
  } catch {
    await fs.mkdir(uploadDir, { recursive: true })
  }
  
  const filePath = path.join(uploadDir, fileName)
  await fs.writeFile(filePath, buffer)
  
  return `/uploads/${fileName}`
}

export async function createProjectAction(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const reqCountry = formData.get("reqCountry") as string || null
    const price = parseFloat(formData.get("price") as string) || 0
    
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
        const url = await saveFileLocally(imageFile)
        images.push({ url, caption })
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        reqCountry,
        price,
        languages: {
          create: languages
        },
        images: {
          create: images
        }
      }
    })

    return { success: true, projectId: project.id }
  } catch (error: any) {
    console.error("Create project error:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function applyToProject(projectId: string) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return { success: false, error: "Not logged in" }

    await prisma.application.create({
      data: { projectId, userId }
    })
    
    return { success: true }
  } catch (error: any) {
    console.error("Apply error:", error)
    return { success: false, error: "Failed to apply" }
  }
}
