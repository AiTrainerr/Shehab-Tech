"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/app/actions/audit"

export async function assignQA(email: string, projectId: string) {
  try {
    const user = await requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR"])

    // Verify the moderator is assigned to this project
    if (user.role === "MODERATOR") {
      const assigned = await prisma.user.findFirst({
        where: { id: user.id, assignedProjects: { some: { id: projectId } } }
      })
      if (!assigned) {
        return { success: false, error: "You are not assigned to this project." }
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, role: true, teamLeaderId: true }
    })

    if (!targetUser) {
      return { success: false, error: "User not found." }
    }

    // Determine the correct teamLeaderId for the QA
    // If the caller is an OUTSOURCED Team Leader, the QA must belong to their team
    let expectedTeamLeaderId: string | null = null
    if (user.role === "MODERATOR") {
      if (user.moderatorType === "OUTSOURCED") {
        expectedTeamLeaderId = user.id
      }
    }

    // If QA already has a teamLeader, it must match
    if (targetUser.teamLeaderId !== expectedTeamLeaderId) {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { teamLeaderId: expectedTeamLeaderId }
      })
    }

    // Grant QA permissions
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: "MODERATOR",
        moderatorType: "QA",
        canReviewQC: true,
        assignedProjects: {
          connect: { id: projectId }
        }
      }
    })

    await createAuditLog(
      "ASSIGN_QA",
      `QA role on project ${projectId} granted to user ${targetUser.id} by ${user.role} (${user.id})`
    )

    return { success: true }
  } catch (error: any) {
    console.error("Assign QA Error:", error)
    return { success: false, error: error.message || "Failed to assign QA." }
  }
}

export async function revokeQA(qaId: string, projectId: string) {
  try {
    const user = await requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR"])

    // Verify the moderator is assigned to this project
    if (user.role === "MODERATOR") {
      const assigned = await prisma.user.findFirst({
        where: { id: user.id, assignedProjects: { some: { id: projectId } } }
      })
      if (!assigned) {
        return { success: false, error: "You are not assigned to this project." }
      }
    }

    const targetQA = await prisma.user.findUnique({
      where: { id: qaId },
      include: { assignedProjects: true }
    })

    if (!targetQA) return { success: false, error: "QA not found" }

    // Disconnect the project
    await prisma.user.update({
      where: { id: qaId },
      data: {
        assignedProjects: {
          disconnect: { id: projectId }
        }
      }
    })

    // If the QA has no more projects, revoke their MODERATOR status
    if (targetQA.assignedProjects.length <= 1) { // 1 because we just disconnected it above but targetQA has the old state
      await prisma.user.update({
        where: { id: qaId },
        data: {
          role: "MEMBER",
          moderatorType: "INTERNAL", // Reset
          canReviewQC: false
        }
      })
    }

    await createAuditLog(
      "REVOKE_QA",
      `QA role on project ${projectId} revoked for user ${qaId} by ${user.role} (${user.id})`
    )

    return { success: true }
  } catch (error: any) {
    console.error("Revoke QA Error:", error)
    return { success: false, error: "Failed to revoke QA." }
  }
}
