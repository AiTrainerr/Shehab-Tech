"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { uploadToSupabase } from "@/lib/storage"

export async function updateTeamRole(memberId: string, newRole: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    // Verify user is team leader of member
    const member = await prisma.user.findFirst({
      where: { id: memberId, teamLeaderId: user.id }
    })
    
    if (!member) return { success: false, error: "Member not found in your team" }

    await prisma.user.update({
      where: { id: memberId },
      data: { teamRole: newRole }
    })

    revalidatePath("/member/team")
    return { success: true }
  } catch (error: any) {
    console.error("Update role error:", error)
    return { success: false, error: "Failed to update role" }
  }
}

export async function freeTask(taskId: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    // Verify task belongs to this team leader
    const task = await prisma.transcriptionTask.findFirst({
      where: { id: taskId, teamId: user.id }
    })

    if (!task) return { success: false, error: "Task not found or unauthorized" }

    if (task.status === "APPROVED" || task.status === "APPROVED_BY_QC") {
      return { success: false, error: "Cannot free a completed task" }
    }

    await prisma.transcriptionTask.update({
      where: { id: taskId },
      data: {
        assignedToId: null,
        qcAssignedToId: null,
        status: "AVAILABLE",
        teamId: null // Completely free it back to the project pool? 
        // Wait, if it's freed, any team or freelancer can claim it again.
      }
    })

    revalidatePath("/member/team")
    return { success: true }
  } catch (error: any) {
    console.error("Free task error:", error)
    return { success: false, error: "Failed to free task" }
  }
}

export async function downloadTeamReport() {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }

    // Fetch approved tasks for this team with segments
    const tasks = await prisma.transcriptionTask.findMany({
      where: {
        teamId: user.id,
        status: { in: ["APPROVED_BY_QC", "APPROVED"] }
      },
      include: {
        project: { select: { title: true } },
        segments: { orderBy: { startTime: "asc" } }
      }
    })

    if (tasks.length === 0) {
      return { success: false, error: "No completed tasks available to export." }
    }

    // Generate Word Document using docx
    const doc = new Document({
      sections: tasks.map(task => {
        // Extract original file name from audioFilePath
        const fileNameMatch = task.audioFilePath.match(/\/([^\/?#]+)[^\/]*$/);
        const originalFileName = fileNameMatch ? fileNameMatch[1] : `Task_${task.id}`;

        const paragraphs = [
          new Paragraph({
            text: `Project: ${task.project.title}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `File Name: ${originalFileName}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 400 }
          })
        ]

        task.segments.forEach(seg => {
          const formatTime = (seconds: number) => {
            const m = Math.floor(seconds / 60)
            const s = Math.floor(seconds % 60)
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
          }
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}] ${seg.speakerLabel}: `,
                  bold: true,
                }),
                new TextRun({
                  text: seg.transcriptText
                })
              ],
              spacing: { after: 200 }
            })
          )
        })

        return {
          properties: {},
          children: paragraphs
        }
      })
    })

    const buffer = await Packer.toBuffer(doc)
    
    // We can't directly return a buffer to the client via server action easily,
    // so we upload it to Supabase as a temporary file and return the URL.
    // Alternatively, we convert it to base64 and return it, but base64 can be large.
    
    const file = new File([new Uint8Array(buffer)], `Team_Report_${user.id}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    const url = await uploadToSupabase(file, 'reports')
    
    return { success: true, url }
  } catch (error: any) {
    console.error("Download report error:", error)
    return { success: false, error: "Failed to generate report" }
  }
}
