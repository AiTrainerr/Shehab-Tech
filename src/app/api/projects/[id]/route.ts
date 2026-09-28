import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        languages: true
      }
    })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Redact privateData unless caller is admin/mod or approved freelancer
    const user = await getCurrentUser()
    let canViewPrivate = false

    if (user) {
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        canViewPrivate = true
      } else {
        const isModerator = await prisma.project.findFirst({
          where: { id, moderators: { some: { id: user.id } } }
        })
        if (isModerator) {
          canViewPrivate = true
        } else {
          const app = await prisma.application.findUnique({
            where: { projectId_userId: { projectId: id, userId: user.id } }
          })
          if (app && ["APPROVED", "ACCEPTED", "WORKING", "PAID", "UNDER_REVIEW", "FINAL_REVIEW"].includes(app.status)) {
            canViewPrivate = true
          }
        }
      }
    }

    if (!canViewPrivate) {
      project.privateData = null
    }

    const sentenceCount = await prisma.projectSentence.count({
      where: { projectId: id }
    })
    const { searchParams } = new URL(request.url)
    const includeSentences = searchParams.get("includeSentences") === "true"

    let sentences = undefined
    if (includeSentences) {
      sentences = await prisma.projectSentence.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
        take: 50 // Limit to 50 for preview performance
      })
    }

    return NextResponse.json({ project, sentenceCount, sentences })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
