import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import JSZip from "jszip"

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  try {
    // Get all sentences with this user's recordings
    const sentences = await prisma.projectSentence.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
      include: {
        recordings: { where: { userId } }
      }
    })

    const recorded = sentences.filter(s => s.recordings.length > 0)
    if (recorded.length === 0) {
      return NextResponse.json({ error: "No recordings found" }, { status: 404 })
    }

    const zip = new JSZip()
    const folder = zip.folder("recordings")!

    // Download each audio file and add to ZIP
    await Promise.all(
      recorded.map(async (sentence) => {
        const rec = sentence.recordings[0]
        try {
          const res = await fetch(rec.fileUrl)
          const buffer = await res.arrayBuffer()
          const filename = `${String(sentence.order).padStart(3, "0")}_${sentence.text.slice(0, 30).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_")}.webm`
          folder.file(filename, buffer)
        } catch (e) {
          console.error(`Failed to fetch recording for sentence ${sentence.id}:`, e)
        }
      })
    )

    // Add a text file with all sentences for reference
    const sentencesText = recorded.map(s => `${s.order}. ${s.text}`).join("\n")
    folder.file("sentences.txt", sentencesText)

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } })
    const filename = `recordings_${project?.title?.replace(/\s+/g, "_") || projectId}.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString()
      }
    })
  } catch (e) {
    console.error("ZIP generation error:", e)
    return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 })
  }
}
