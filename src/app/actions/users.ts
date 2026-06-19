"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "@/app/actions/audit"

export async function rateUser(userId: string, rating: number) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Optional: Verify user is ADMIN
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Unauthorized" }

    await prisma.user.update({
      where: { id: userId },
      data: { rating }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Rate user error:", error)
    return { success: false, error: "Failed to update rating" }
  }
}

export async function toggleModeratorApproval(userId: string, isApproved: boolean) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    await prisma.user.update({
      where: { id: userId },
      data: { isApproved }
    })

    await createAuditLog(
      isApproved ? "APPROVE_MODERATOR" : "REVOKE_MODERATOR",
      `${isApproved ? "Approved" : "Revoked approval for"} moderator ${targetUser?.email || userId}`
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Toggle moderator approval error:", error)
    return { success: false, error: "Failed to toggle moderator approval" }
  }
}

export async function assignModeratorProject(userId: string, projectId: string | null) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    let projectTitle = "None"
    if (projectId) {
      const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true }
      })
      if (proj) projectTitle = proj.title
    }

    await prisma.user.update({
      where: { id: userId },
      data: { assignedProjectId: projectId }
    })

    await createAuditLog(
      "ASSIGN_MODERATOR_PROJECT",
      `Assigned moderator ${targetUser?.email || userId} to project "${projectTitle}"`
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Assign moderator project error:", error)
    return { success: false, error: "Failed to assign project" }
  }
}
