import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import JSZip from "jszip"

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

  const cookieStore = await cookies()
  const userIdFromCookie = cookieStore.get("userId")?.value
  if (!userIdFromCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  try {
    // Fetch logged in user to check role
    const loggedInUser = await prisma.user.findUnique({
      where: { id: userIdFromCookie },
      select: { role: true }
    })
    if (!loggedInUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const targetUserId = request.nextUrl.searchParams.get("userId") || userIdFromCookie

    // Authorization check
    if (targetUserId !== userIdFromCookie && loggedInUser.role !== "ADMIN" && loggedInUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get candidate details
    const candidate = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, firstName: true, lastName: true, age: true, gender: true }
    })
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 })

    // Get project settings
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true, namingRule: true, audioFormat: true }
    })
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // Get all sentences with this user's recordings
    const sentences = await prisma.projectSentence.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
      include: {
        recordings: { where: { userId: targetUserId } }
      }
    })

    const recorded = sentences.filter(s => s.recordings.length > 0)
    if (recorded.length === 0) {
      return NextResponse.json({ error: "No recordings found" }, { status: 404 })
    }

    const zip = new JSZip()
    const usedNames = new Set<string>()

    const getExtension = (url: string, defaultFormat: string) => {
      try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const lastDot = pathname.lastIndexOf(".")
        if (lastDot !== -1) {
          const ext = pathname.substring(lastDot + 1).toLowerCase()
          if (ext && ext.length <= 4) return ext
        }
      } catch {}
      return defaultFormat.toLowerCase() || "webm"
    }

    const cleanFilename = (text: string) => {
      return text.trim().replace(/[\/\\:\*\?"<>\|]/g, "_").replace(/\s+/g, "_")
    }

    const getUniqueFilename = (baseName: string, ext: string) => {
      let candidateName = `${baseName}.${ext}`
      let counter = 1
      while (usedNames.has(candidateName.toLowerCase())) {
        candidateName = `${baseName}_${counter}.${ext}`
        counter++
      }
      usedNames.add(candidateName.toLowerCase())
      return candidateName
    }

    // Build the outer folder name: ID_FirstName_LastName_Age_Gender
    let genderForFolder = "N-A"
    if (candidate.gender) {
      const g = candidate.gender.toLowerCase()
      if (g === "male" || g === "ذكر") {
        genderForFolder = "ذكر"
      } else if (g === "female" || g === "أنثى" || g === "انثى") {
        genderForFolder = "أنثى"
      } else {
        genderForFolder = candidate.gender
      }
    }
    const ageFolderStr = candidate.age ? String(candidate.age) : "N-A"
    const outerFolderName = `${candidate.id}_${candidate.firstName}_${candidate.lastName}_${ageFolderStr}_${genderForFolder}`

    // Download each audio file and add to ZIP inside the outer folder
    await Promise.all(
      recorded.map(async (sentence) => {
        const rec = sentence.recordings[0]
        try {
          const res = await fetch(rec.fileUrl)
          const buffer = await res.arrayBuffer()
          
          const ext = getExtension(rec.fileUrl, project.audioFormat || "webm")
          let innerFilename = ""
          
          if (project.namingRule === "TEXT") {
            const baseName = cleanFilename(sentence.text).slice(0, 80)
            innerFilename = getUniqueFilename(baseName, ext)
          } else {
            // SEQUENCE
            innerFilename = `${sentence.order}.${ext}`
          }

          // Place file inside the outer folder: FolderName/filename
          zip.file(`${outerFolderName}/${innerFilename}`, buffer)
        } catch (e) {
          console.error(`Failed to fetch recording for sentence ${sentence.id}:`, e)
        }
      })
    )

    const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })

    // ZIP filename = same as the outer folder name + .zip
    const zipFilename = `${outerFolderName}.zip`

    return new NextResponse(zipBuffer as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zipFilename)}`,
        "Content-Length": zipBuffer.byteLength.toString()
      }
    })
  } catch (e) {
    console.error("ZIP generation error:", e)
    return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 })
  }
}
