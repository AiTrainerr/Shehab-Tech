export async function extendApplicationTime(applicationId: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const admin = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    if (!admin || !["ADMIN", "SUPERADMIN"].includes(admin.role)) return { success: false, error: "Forbidden" }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true }
    })
    if (!app) return { success: false, error: "Application not found" }

    if (app.project.scriptType === "DYNAMIC_POOL" && app.project.sentencesPerUser) {
      // Check how many sentences the user already has assigned
      const currentAssigned = await prisma.projectSentence.count({
        where: { projectId: app.projectId, assignedUserId: app.userId }
      })

      const needed = app.project.sentencesPerUser - currentAssigned

      if (needed > 0) {
        // Find unassigned sentences
        const unassigned = await prisma.projectSentence.findMany({
          where: { projectId: app.projectId, assignedUserId: null },
          take: needed,
          orderBy: { order: "asc" }
        })

        if (unassigned.length < needed) {
          return { success: false, error: "?? ???? ?????? ????? ??? ?????? ?????? ?????. ??????: " + unassigned.length }
        }

        // Assign them to the user
        const unassignedIds = unassigned.map(s => s.id)
        await prisma.projectSentence.updateMany({
          where: { id: { in: unassignedIds } },
          data: { assignedUserId: app.userId }
        })
      }
    }

    // Update application
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "WORKING",
        updatedAt: new Date() // Reset the timeout clock
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("extend time error:", error)
    return { success: false, error: "Failed to extend time" }
  }
}
