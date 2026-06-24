import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TranscriptionEditor, Segment } from "@/components/transcription-editor"
import { ArrowLeft, Clock, FileAudio, LayoutList, CheckCircle2, AlertCircle, Headphones, ArrowRight } from "lucide-react"
import { TranscriptionClientWrapper } from "./TranscriptionClientWrapper"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function FreelancerTranscriptionPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  // Fetch task and verify ownership
  const task = await prisma.transcriptionTask.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { images: true } },
      segments: { orderBy: { startTime: "asc" } },
    }
  })

  if (!task) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
        <Link href="/member" className="underline">Back to Dashboard</Link>
      </div>
    )
  }

  // Ensure this task is assigned to the current user
  if (task.assignedToId !== userId) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view this task.</p>
        <Link href="/member" className="underline">Back to Dashboard</Link>
      </div>
    )
  }

  // Convert Prisma segments to Editor segments
  const initialSegments: Segment[] = task.segments.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    speakerLabel: s.speakerLabel,
    transcriptText: s.transcriptText,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
        <div>
          <Link href="/member" className="text-sm font-semibold text-foreground/50 hover:text-primary mb-2 flex items-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Headphones className="w-7 h-7 text-primary" />
            {task.project.title} — Audio Transcription
          </h1>
          <p className="text-foreground/60 text-sm mt-1">
            Select regions from the audio waveform to write the transcription. Saving happens when you click the save button.
          </p>
        </div>
        
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
          task.status === "APPROVED" || task.status === "APPROVED_BY_QC" ? "bg-green-500/10 text-green-500" :
          task.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
          task.status === "SUBMITTED_TO_QC" || task.status === "UNDER_QC_REVIEW" ? "bg-purple-500/10 text-purple-500" :
          "bg-blue-500/10 text-blue-500"
        }`}>
          Status: {task.status.replace(/_/g, " ")}
        </div>
      </div>

      {/* Project Images */}
      {task.project.images && task.project.images.length > 0 && (
        <div className="glass p-6 rounded-2xl border border-border mb-6">
          <h2 className="text-lg font-bold mb-4">Project Guidelines / Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.project.images.map(img => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-border bg-card">
                <img src={img.url} alt={img.caption || "Guideline image"} className="w-full object-cover max-h-60" />
                {img.caption && <div className="p-3 text-sm text-foreground/80 bg-background/50">{img.caption}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Client Component */}
      <TranscriptionClientWrapper
        taskId={task.id}
        audioUrl={task.audioFilePath}
        initialSegments={initialSegments}
        speakerCount={task.speakerCount}
        isReadOnly={["SUBMITTED_TO_QC", "UNDER_QC_REVIEW", "APPROVED_BY_QC", "APPROVED"].includes(task.status)}
        isQC={task.qcAssignedToId === userId}
      />
    </div>
  )
}

