"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { createAuditLog } from "@/app/actions/audit"
import { revalidatePath } from "next/cache"

export async function grantSupervisorPermissions(
  email: string,
  projectId: string,
  canReviewQC: boolean,
  canApproveApplications: boolean,
  moderatorType: "INTERNAL" | "OUTSOURCED" = "INTERNAL"
) {
  try {
    const supabase = await createClientServer()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, error: "Not logged in" }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true, firstName: true, lastName: true }
    })

    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    if (!email) return { success: false, error: "Email is required" }
    if (!projectId) return { success: false, error: "Project is required" }

    // Find user to grant permissions to
    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (!targetUser) {
      return { success: false, error: "User with this email was not found. Please register first." }
    }

    // Update target user's role to MODERATOR, and enable permissions
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: "MODERATOR",
        isApproved: true,
        assignedProjects: {
          connect: { id: projectId }
        },
        canReviewQC,
        canApproveApplications,
        moderatorType
      }
    })

    const reviewerName = `${dbUser?.firstName} ${dbUser?.lastName}`
    await createAuditLog(
      `GRANT_SUPERVISOR_PERMISSIONS`,
      `Admin ${reviewerName} granted supervisor permissions to user ${targetUser.email} (Project ID: ${projectId}, QC: ${canReviewQC}, Applications: ${canApproveApplications})`
    )

    revalidatePath("/admin")
    revalidatePath("/admin/users")

    return { success: true }
  } catch (e: any) {
    console.error("Grant supervisor permissions error:", e)
    return { success: false, error: e.message || "Failed to grant supervisor permissions" }
  }
}
