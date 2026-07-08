import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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
