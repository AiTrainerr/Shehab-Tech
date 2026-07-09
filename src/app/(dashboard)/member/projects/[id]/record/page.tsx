import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, Mic } from "lucide-react"
import { VoiceRecorder } from "@/components/voice-recorder"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const userObj = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!userObj) redirect("/login")

  // Verify application is approved
  const application = await prisma.application.findUnique({
    where: { projectId_userId: { projectId: id, userId } }
  })

  const isApproved = application && ["APPROVED", "ACCEPTED", "WORKING", "PAID", "UNDER_REVIEW", "FINAL_REVIEW"].includes(application.status)
  if (!isApproved) {
    redirect(`/member/projects/${id}`)
  }

  let sentences: any[] = []

  if (project.scriptType === "STATIC") {
    sentences = await prisma.projectSentence.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
      take: project.sentencesPerUser || undefined,
      include: { recordings: { where: { userId } } }
    })
  } else if (application.speakerCode && project.scriptType === "BATCH_CODE") {
    // Only use speakerCode grouping if it's explicitly a BATCH_CODE project type
    // or if we decide to maintain legacy speakerCode grouping. Currently, we just use application.speakerCode for folder naming.
    // Safety Check: If the user was previously assigned to a DIFFERENT speakerCode, 
    // release those old sentences to prevent locking mismatches.
    await prisma.projectSentence.updateMany({
      where: { 
        projectId: id, 
        assignedUserId: userId,
        speakerCode: { not: application.speakerCode }
      },
      data: { assignedUserId: null }
    })

    // Ensure the new sentences are locked to this user
    await prisma.projectSentence.updateMany({
      where: { projectId: id, speakerCode: application.speakerCode, assignedUserId: null },
      data: { assignedUserId: userId }
    })
    
    sentences = await prisma.projectSentence.findMany({
      where: { projectId: id, speakerCode: application.speakerCode },
      orderBy: { order: "asc" },
      include: { recordings: { where: { userId } } }
    })
  } else if (project.scriptType === "PRE_ASSIGNED") {
    sentences = await prisma.projectSentence.findMany({
      where: { projectId: id, assignedEmail: userObj.email },
      orderBy: { order: "asc" },
      include: { recordings: { where: { userId } } }
    })
  } else if (project.scriptType === "DYNAMIC_POOL") {
    // First, check if the user already has sentences assigned
    sentences = await prisma.projectSentence.findMany({
      where: { projectId: id, assignedUserId: userId },
      orderBy: { order: "asc" },
      include: { recordings: { where: { userId } } }
    })

    // If no sentences assigned, assign them dynamically
    if (sentences.length === 0 && project.sentencesPerUser) {
      // Find unassigned sentences
      const unassigned = await prisma.projectSentence.findMany({
        where: { projectId: id, assignedUserId: null },
        orderBy: { order: "asc" },
        take: project.sentencesPerUser
      })

      if (unassigned.length > 0) {
        // Lock them to this user
        const unassignedIds = unassigned.map((s: any) => s.id)
        await prisma.projectSentence.updateMany({
          where: { id: { in: unassignedIds } },
          data: { assignedUserId: userId }
        })

        // Fetch again to get the recordings include
        sentences = await prisma.projectSentence.findMany({
          where: { projectId: id, assignedUserId: userId },
          orderBy: { order: "asc" },
          include: { recordings: { where: { userId } } }
        })
      }
    }
  }

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

          {application.speakerCode && project.scriptType === "PRE_ASSIGNED" && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">كود المسجّل الخاص بك (Speaker Code)</p>
                <p className="text-2xl font-black text-primary tracking-widest">{application.speakerCode}</p>
                <p className="text-xs text-foreground/50 mt-0.5">هذا الكود هو اسم ملفك — احتفظ به للمراجعة والدفع</p>
              </div>
            </div>
          )}
        </div>

        {sentences.length > 0 ? (
          <VoiceRecorder
            projectId={id}
            speakerCode={project.scriptType === "PRE_ASSIGNED" ? application.speakerCode || undefined : undefined}
            applicationStatus={application.status}
            audioFormat={project.audioFormat}
            sampleRate={project.sampleRate}
            bitDepth={project.bitDepth}
            channels={project.channels}
            minDuration={project.minDuration}
            maxDuration={project.maxDuration}
            enableNoiseCancellation={project.enableNoiseCancellation}
            sentences={sentences.map((s: any) => ({
              id: s.id,
              text: s.text,
              order: s.order,
              audioId: s.audioId,
              speed: s.speed,
              recordings: s.recordings.map((r: any) => ({
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
