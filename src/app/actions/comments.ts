"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function addComment(projectId: string, content: string, parentId?: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    if (!content || content.trim() === "") {
      return { success: false, error: "Comment cannot be empty" }
    }

    await prisma.comment.create({
      data: {
        content: content.trim(),
        projectId,
        authorId: user.id,
        parentId: parentId || null
      }
    })

    revalidatePath(`/member/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Add comment error:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function deleteComment(commentId: string, projectId: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) return { success: false, error: "Comment not found" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    
    // Only the author or an ADMIN can delete a comment
    if (comment.authorId !== user.id && dbUser?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    revalidatePath(`/member/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Delete comment error:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}
