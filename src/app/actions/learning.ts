"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { uploadToSupabase } from "@/lib/storage"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/app/actions/audit"

export async function createLearningResource(formData: FormData) {
  try {
    const user = await requireRole(["ADMIN", "SUPER_ADMIN"])

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

    const created = await prisma.learningResource.create({
      data: { title, description, link, category, imageUrl }
    })

    await createAuditLog(
      "CREATE_LEARNING_RESOURCE",
      `Resource '${title}' created by ${user.role} (${user.id})`
    )

    revalidatePath("/admin/skills")
    revalidatePath("/member/learn")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteLearningResource(id: string) {
  try {
    const user = await requireRole(["ADMIN", "SUPER_ADMIN"])

    await prisma.learningResource.delete({ where: { id } })

    await createAuditLog(
      "DELETE_LEARNING_RESOURCE",
      `Resource ${id} deleted by ${user.role} (${user.id})`
    )

    revalidatePath("/admin/skills")
    revalidatePath("/member/learn")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
