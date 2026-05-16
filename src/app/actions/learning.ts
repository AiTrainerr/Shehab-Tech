"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

import { uploadToSupabase } from "@/lib/storage"

// saveFileLocally is no longer used for production, using uploadToSupabase instead

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
    imageUrl = await uploadToSupabase(imageFile, 'learning')
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
