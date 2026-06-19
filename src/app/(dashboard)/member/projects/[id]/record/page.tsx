import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, Mic } from "lucide-react"
import { VoiceRecorder } from "@/components/voice-recorder"

export default async function ProjectRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  // Fetch project details
  const project = await prisma.project.findUnique({
    where: { id }
  })

  if (!project) notFound()

  // Verify application is approved
  const application = await prisma.application.findUnique({
    where: { projectId_userId: { projectId: id, userId } }
  })

  const isApproved = application && ["APPROVED", "ACCEPTED", "WORKING", "PAID", "UNDER_REVIEW"].includes(application.status)
  if (!isApproved) {
    redirect(`/member/projects/${id}`)
  }

  // Fetch sentences
  const sentences = await prisma.projectSentence.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
    include: { recordings: { where: { userId } } }
  })

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/member/projects/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Project Details
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            <Mic className="w-3.5 h-3.5" /> Recording Session
          </div>
        </div>

        <div className="glass p-6 sm:p-8 rounded-2xl border border-border mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">{project.title}</h1>
          <p className="text-sm text-foreground/60">Follow the rules and read each sentence carefully.</p>
        </div>

        {sentences.length > 0 ? (
          <VoiceRecorder
            projectId={id}
            applicationStatus={application.status}
            audioFormat={project.audioFormat}
            sampleRate={project.sampleRate}
            bitDepth={project.bitDepth}
            channels={project.channels}
            minDuration={project.minDuration}
            maxDuration={project.maxDuration}
            sentences={sentences.map(s => ({
              id: s.id,
              text: s.text,
              order: s.order,
              recordings: s.recordings.map(r => ({
                fileUrl: r.fileUrl,
                expiresAt: r.expiresAt,
                status: r.status,
                rejectionReason: r.rejectionReason
              }))
            }))}
          />
        ) : (
          <div className="glass p-12 rounded-2xl border border-border text-center">
            <p className="text-foreground/60">No sentences found for this project.</p>
          </div>
        )}
      </div>
    </div>
  )
}
