"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { createManyNotifications } from "@/app/actions/notifications"

export async function addComment(projectId: string, content: string, parentId?: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    if (!content || content.trim() === "") {
      return { success: false, error: "Comment cannot be empty" }
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        projectId,
        authorId: user.id,
        parentId: parentId || null
      }
    })

    // Trigger Admin and parent author notifications
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true }
      })
      const commenter = await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true }
      })
      const commenterName = commenter ? `${commenter.firstName} ${commenter.lastName}` : "Someone"

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      })

      const parentComment = parentId ? await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true }
      }) : null

      const notificationsToCreate = admins
        .filter(admin => admin.id !== user.id)
        .map(admin => ({
          userId: admin.id,
          title: `New Comment on ${project?.title || "Project"}`,
          content: `${commenterName} commented: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
          link: `/member/projects/${projectId}#comment-${newComment.id}`
        }))

      if (parentComment && parentComment.authorId !== user.id) {
        const isAlreadyNotified = admins.some(admin => admin.id === parentComment.authorId)
        if (!isAlreadyNotified) {
          notificationsToCreate.push({
            userId: parentComment.authorId,
            title: `New Reply to your comment`,
            content: `${commenterName} replied: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
            link: `/member/projects/${projectId}#comment-${newComment.id}`
          })
        }
      }

      if (notificationsToCreate.length > 0) {
        await createManyNotifications(notificationsToCreate)
      }
    } catch (notifErr) {
      console.error("Failed to create notifications for comment:", notifErr)
    }

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
