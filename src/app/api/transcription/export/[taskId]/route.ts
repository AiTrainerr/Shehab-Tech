import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx"
import ExcelJS from "exceljs"

export const dynamic = "force-dynamic"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, canReviewQC: true }
    })

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await prisma.transcriptionTask.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        segments: { orderBy: { startTime: "asc" } },
        assignedTo: true
      }
    })

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    const format = req.nextUrl.searchParams.get("format") || "word" // word, excel, srt, json

    // 1. JSON Export
    if (format === "json") {
      return NextResponse.json(task.segments)
    }

    // 2. SRT Export
    if (format === "srt") {
      let srtContent = ""
      task.segments.forEach((seg, i) => {
        const start = formatTime(seg.startTime).replace(".", ",")
        const end = formatTime(seg.endTime).replace(".", ",")
        srtContent += `${i + 1}\n00:${start}0 --> 00:${end}0\n[${seg.speakerLabel}] ${seg.transcriptText}\n\n`
      })
      
      return new NextResponse(srtContent, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="task-${task.id}.srt"`
        }
      })
    }

    // 3. Excel Export
    if (format === "excel") {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Transcription")

      sheet.columns = [
        { header: "Name", key: "name", width: 20 },
        { header: "音频", key: "audio_cn", width: 10 },
        { header: "_id", key: "_id", width: 25 },
        { header: "audio", key: "audio", width: 40 },
        { header: "audio_duration", key: "audio_duration", width: 15 },
        { header: "geo_coverage", key: "geo_coverage", width: 15 },
        { header: "context_audio", key: "context_audio", width: 15 },
        { header: "context_start", key: "context_start", width: 15 },
        { header: "context_end", key: "context_end", width: 15 },
        { header: "transcription", key: "transcription", width: 60 },
        { header: "Full-Text ASR(without reference)", key: "asr1", width: 60 },
        { header: "Full-Text ASR(with reference)", key: "asr2", width: 60 },
        { header: "Key Information Extraction", key: "key_info", width: 30 },
        { header: "Remark", key: "remark", width: 30 },
        { header: "Screenshot of Google map", key: "screen1", width: 15 },
        { header: "Screenshot of Google map", key: "screen2", width: 15 },
        { header: "Screenshot of Google map", key: "screen3", width: 15 },
        { header: "Screenshot of Google map", key: "screen4", width: 15 }
      ]

      task.segments.forEach(seg => {
        sheet.addRow({
          name: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned",
          audio_cn: "",
          _id: task.id,
          audio: task.audioFilePath?.split('/').pop() || "audio.wav",
          audio_duration: task.duration || "",
          geo_coverage: "",
          context_audio: "",
          context_start: seg.startTime,
          context_end: seg.endTime,
          transcription: seg.transcriptText,
          asr1: seg.transcriptText,
          asr2: seg.transcriptText,
          key_info: "",
          remark: seg.speakerLabel || "",
          screen1: "",
          screen2: "",
          screen3: "",
          screen4: ""
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="task-${task.id}.xlsx"`
        }
      })
    }

    // 4. Word Export
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Time", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Speaker", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Transcript", bold: true })] })] }),
          ],
        }),
        ...task.segments.map(seg => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(`${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}`)] }),
              new TableCell({ children: [new Paragraph(seg.speakerLabel)] }),
              new TableCell({ children: [new Paragraph(seg.transcriptText)] }),
            ]
          })
        ))
      ]
    })

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: `Transcription Report: ${task.project.title}`, bold: true, size: 32 })
            ]
          }),
          new Paragraph({ text: "" }), // Spacer
          table
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="task-${task.id}.docx"`
      }
    })

  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
