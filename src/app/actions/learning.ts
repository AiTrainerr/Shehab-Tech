"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

async function saveFileLocally(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = path.extname(file.name) || ".jpg"
  const fileName = `${crypto.randomBytes(16).toString("hex")}${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  try { await fs.access(uploadDir) } catch { await fs.mkdir(uploadDir, { recursive: true }) }
  await fs.writeFile(path.join(uploadDir, fileName), buffer)
  return `/uploads/${fileName}`
}

export async function createLearningResource(formData: FormData) {
  const cookieStore = await cookies()
  const userRole = cookieStore.get("userRole")?.value
  if (userRole !== "ADMIN") return { success: false, error: "Unauthorized" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string | null
  const link = formData.get("link") as string
  const category = formData.get("category") as string | null
  const imageFile = formData.get("image") as File | null

  if (!title || !link) return { success: false, error: "Title and link are required" }

  let imageUrl: string | null = null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await saveFileLocally(imageFile)
  }

  await prisma.learningResource.create({
    data: { title, description, link, category, imageUrl }
  })

  revalidatePath("/admin/skills")
  revalidatePath("/member/learn")
  return { success: true }
}

export async function deleteLearningResource(id: string) {
  const cookieStore = await cookies()
  const userRole = cookieStore.get("userRole")?.value
  if (userRole !== "ADMIN") return { success: false, error: "Unauthorized" }
  await prisma.learningResource.delete({ where: { id } })
  revalidatePath("/admin/skills")
  revalidatePath("/member/learn")
  return { success: true }
}
