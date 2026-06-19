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
    return NextResponse.json({ project, sentenceCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
