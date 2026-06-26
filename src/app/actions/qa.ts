"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function assignQA(email: string, projectId: string) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) return { success: false, error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, moderatorType: true, assignedProjects: { select: { id: true } } }
    })

    if (!currentUser || (currentUser.role !== "MODERATOR" && currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify the moderator is assigned to this project
    const hasProject = currentUser.assignedProjects.some(p => p.id === projectId)
    if (!hasProject && currentUser.role === "MODERATOR") {
      return { success: false, error: "You are not assigned to this project." }
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
    if (currentUser.role === "MODERATOR") {
      if (currentUser.moderatorType === "OUTSOURCED") {
        expectedTeamLeaderId = currentUser.id
      }
    }

    // If QA already has a teamLeader, it must match
    if (targetUser.teamLeaderId !== expectedTeamLeaderId) {
       // Update their teamLeaderId to match the assigning moderator
       // Or we can just enforce it
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

    return { success: true }
  } catch (error: any) {
    console.error("Assign QA Error:", error)
    return { success: false, error: error.message || "Failed to assign QA." }
  }
}

export async function revokeQA(qaId: string, projectId: string) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) return { success: false, error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, assignedProjects: { select: { id: true } } }
    })

    if (!currentUser || (currentUser.role !== "MODERATOR" && currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" }
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

    return { success: true }
  } catch (error: any) {
    console.error("Revoke QA Error:", error)
    return { success: false, error: "Failed to revoke QA." }
  }
}
