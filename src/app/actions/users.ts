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
    
    // Verify caller is ADMIN or authorized MODERATOR
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const isAllowed = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN" || (dbUser?.role === "MODERATOR" && dbUser.canApproveApplications)
    if (!isAllowed) return { success: false, error: "Unauthorized" }

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

export async function toggleSupervisorPermission(userId: string, isSupervisor: boolean) {
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

    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { isSupervisor }
    // })

    await createAuditLog(
      isSupervisor ? "GRANT_SUPERVISOR" : "REVOKE_SUPERVISOR",
      `${isSupervisor ? "Granted" : "Revoked"} supervisor permissions for ${targetUser?.email || userId}`
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Toggle supervisor permission error:", error)
    return { success: false, error: "Failed to toggle supervisor permission" }
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

    if (projectId) {
      await prisma.user.update({
        where: { id: userId },
        data: { assignedProjects: { connect: { id: projectId } } }
      })
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { assignedProjects: { set: [] } }
      })
    }

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

export async function updateModeratorPermissions(
  userId: string,
  data: {
    canReviewQC?: boolean
    canApproveApplications?: boolean
    role?: string
    revokeAllProjects?: boolean
    isApproved?: boolean
    moderatorType?: "INTERNAL" | "OUTSOURCED"
  }
) {
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

    const { revokeAllProjects, ...updateData } = data

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...(revokeAllProjects ? { assignedProjects: { set: [] } } : {})
      }
    })

    await createAuditLog(
      "UPDATE_SUPERVISOR_PERMISSIONS",
      `Admin ${dbUser.firstName} updated supervisor ${targetUser?.email || userId} permissions: ${JSON.stringify(data)}`
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Update moderator permissions error:", error)
    return { success: false, error: "Failed to update permissions" }
  }
}

export async function removeSupervisorProject(userId: string, projectId: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { assignedProjects: { disconnect: { id: projectId } } }
    })

    revalidatePath("/admin/supervisors")
    return { success: true }
  } catch (error: any) {
    console.error("Remove project error:", error)
    return { success: false, error: "Failed to remove project" }
  }
}

