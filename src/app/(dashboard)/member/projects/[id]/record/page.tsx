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

  if (application.speakerCode) {
    sentences = await prisma.projectSentence.findMany({
      where: { projectId: id, speakerCode: application.speakerCode },
      orderBy: { order: "asc" },
      include: { recordings: { where: { userId } } }
    })
  } else if (project.scriptType === "STATIC") {
    // Check if sentencesPerUser is defined to assign a unique slice per user
    const perUser = project.sentencesPerUser || project.recordingDuration

    if (perUser && perUser > 0) {
      // Check if user already has assigned sentences (assignedUserId)
      const existing = await prisma.projectSentence.findMany({
        where: { projectId: id, assignedUserId: userId },
        orderBy: { order: "asc" },
        include: { recordings: { where: { userId } } }
      })

      if (existing.length > 0) {
        sentences = existing
      } else {
        // Assign a unique slice: find unassigned sentences
        const unassigned = await prisma.projectSentence.findMany({
          where: { projectId: id, assignedUserId: null },
          orderBy: { order: "asc" },
          take: perUser
        })

        if (unassigned.length > 0) {
          const ids = unassigned.map((s: any) => s.id)
          await prisma.projectSentence.updateMany({
            where: { id: { in: ids } },
            data: { assignedUserId: userId }
          })
          sentences = await prisma.projectSentence.findMany({
            where: { projectId: id, assignedUserId: userId },
            orderBy: { order: "asc" },
            include: { recordings: { where: { userId } } }
          })
        } else {
          // All assigned already — fallback: just show their already-assigned
          sentences = await prisma.projectSentence.findMany({
            where: { projectId: id, assignedUserId: userId },
            orderBy: { order: "asc" },
            include: { recordings: { where: { userId } } }
          })
        }
      }
    } else {
      // No perUser limit — show all (backwards compatible)
      sentences = await prisma.projectSentence.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
        include: { recordings: { where: { userId } } }
      })
    }
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

          {application.speakerCode && (
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
            speakerCode={application.speakerCode || undefined}
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
