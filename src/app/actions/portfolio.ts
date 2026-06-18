"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { uploadToSupabase } from "@/lib/storage"
import { revalidatePath } from "next/cache"

export async function addPortfolioItem(formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const imageFile = formData.get("image") as File | null

    if (!title) return { success: false, error: "Title is required" }

    let imageUrl: string | null = null
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToSupabase(imageFile, 'portfolio')
    }

    await prisma.portfolio.create({
      data: { userId: user.id, title, description, imageUrl }
    })

    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Portfolio error:", error)
    return { success: false, error: `Upload error: ${error.message || 'Unknown error'}` }
  }
}

export async function updatePortfolioItem(id: string, formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const imageFile = formData.get("image") as File | null

    if (!title) return { success: false, error: "Title is required" }

    // Check if portfolio belongs to user
    const existing = await prisma.portfolio.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Portfolio not found or unauthorized" }
    }

    let imageUrl = existing.imageUrl
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToSupabase(imageFile, 'portfolio')
    }

    await prisma.portfolio.update({
      where: { id },
      data: { title, description, imageUrl }
    })

    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Update portfolio error:", error)
    return { success: false, error: `Upload error: ${error.message || 'Unknown error'}` }
  }
}

export async function deletePortfolioItem(id: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const existing = await prisma.portfolio.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Portfolio not found or unauthorized" }
    }

    await prisma.portfolio.delete({ where: { id } })

    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Delete portfolio error:", error)
    return { success: false, error: "Failed to delete portfolio item" }
  }
}

export async function addComment(formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const projectId = formData.get("projectId") as string
    const content = formData.get("content") as string

    if (!content?.trim()) return { success: false, error: "Comment cannot be empty" }

    await prisma.comment.create({
      data: { projectId, authorId: user.id, content: content.trim() }
    })

    return { success: true }
  } catch (error: any) {
    console.error("Comment error:", error)
    return { success: false, error: "Failed to add comment" }
  }
}
