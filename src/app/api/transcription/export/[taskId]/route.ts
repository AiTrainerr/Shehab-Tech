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
        segments: { orderBy: { startTime: "asc" } }
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
        { header: "Start Time", key: "start", width: 15 },
        { header: "End Time", key: "end", width: 15 },
        { header: "Speaker", key: "speaker", width: 20 },
        { header: "Transcript", key: "text", width: 80 }
      ]

      task.segments.forEach(seg => {
        sheet.addRow({
          start: formatTime(seg.startTime),
          end: formatTime(seg.endTime),
          speaker: seg.speakerLabel,
          text: seg.transcriptText
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
