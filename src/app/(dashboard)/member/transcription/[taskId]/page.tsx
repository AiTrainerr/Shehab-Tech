import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TranscriptionEditor, Segment } from "@/components/transcription-editor"
import { ArrowLeft, Clock, FileAudio, LayoutList, CheckCircle2, AlertCircle, Headphones, ArrowRight } from "lucide-react"
import { TranscriptionClientWrapper } from "./TranscriptionClientWrapper"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function FreelancerTranscriptionPage({ params }: { params: { taskId: string } }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  // Fetch task and verify ownership
  const task = await prisma.transcriptionTask.findUnique({
    where: { id: params.taskId },
    include: {
      project: true,
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
          task.status === "APPROVED" ? "bg-green-500/10 text-green-500" :
          task.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
          task.status === "SUBMITTED" ? "bg-purple-500/10 text-purple-500" :
          "bg-blue-500/10 text-blue-500"
        }`}>
          Status: {task.status}
        </div>
      </div>

      {/* Editor Client Component */}
      {/* Note: We pass a server action or API route to handle saving. In Next.js App Router, passing async functions directly from server components to client components is supported if they are "use server" functions. However, passing an API wrapper is often cleaner for complex data. */}
      <TranscriptionClientWrapper
        taskId={task.id}
        audioUrl={task.audioFilePath}
        initialSegments={initialSegments}
        speakerCount={task.speakerCount}
        isReadOnly={task.status === "SUBMITTED" || task.status === "APPROVED"}
      />
    </div>
  )
}

