import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TranscriptionEditor, Segment } from "@/components/transcription-editor"
import { ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminQATranscriptionPage({ params }: { params: { taskId: string } }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  // Check admin/moderator
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, canReviewQC: true }
  })

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
    redirect("/admin")
  }

  // Fetch task
  const task = await prisma.transcriptionTask.findUnique({
    where: { id: params.taskId },
    include: {
      project: true,
      assignedTo: { select: { firstName: true, lastName: true } },
      segments: { orderBy: { startTime: "asc" } },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 1, include: { moderator: { select: { firstName: true } } } }
    }
  })

  if (!task) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
        <Link href="/admin" className="underline">Back to Dashboard</Link>
      </div>
    )
  }

  const initialSegments: Segment[] = task.segments.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    speakerLabel: s.speakerLabel,
    transcriptText: s.transcriptText,
  }))

  const lastReview = task.reviews[0]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
        <div>
          <Link href="/admin/transcription" className="text-sm font-semibold text-foreground/50 hover:text-primary mb-2 flex items-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" /> العودة لقائمة المراجعة
          </Link>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
            مراجعة الجودة (QA) — {task.project.title}
          </h1>
          <p className="text-foreground/60 text-sm mt-1">
            مفرغ النص: <span className="font-bold text-foreground">{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "غير معين"}</span>
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
            task.status === "APPROVED" ? "bg-green-500/10 text-green-500" :
            task.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
            task.status === "SUBMITTED" ? "bg-purple-500/10 text-purple-500" :
            "bg-blue-500/10 text-blue-500"
          }`}>
            حالة المهمة: {task.status}
          </div>
          {lastReview && (
            <span className="text-xs text-foreground/50">
              آخر مراجعة بواسطة: {lastReview.moderator.firstName} ({lastReview.status})
            </span>
          )}
        </div>
      </div>

      <TranscriptionQAClientWrapper
        taskId={task.id}
        audioUrl={task.audioFilePath}
        initialSegments={initialSegments}
        speakerCount={task.speakerCount}
        isReadOnly={true}
      />
    </div>
  )
}

// ── Client Wrapper for Review Actions ───────────────────────────────────────────
"use client"
import { useRouter } from "next/navigation"

function TranscriptionQAClientWrapper({ taskId, audioUrl, initialSegments, speakerCount, isReadOnly }: any) {
  const router = useRouter()

  const handleApprove = async () => {
    if (!confirm("هل أنت متأكد من قبول التفريغ بشكل نهائي؟")) return
    try {
      const res = await fetch(`/api/transcription/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", notes: "" })
      })

      if (!res.ok) throw new Error("Failed to approve")
      alert("تم قبول التفريغ بنجاح!")
      router.push("/admin/transcription")
    } catch (e) {
      console.error(e)
      alert("حدث خطأ أثناء المراجعة.")
    }
  }

  const handleReject = async (notes: string) => {
    try {
      const res = await fetch(`/api/transcription/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", notes })
      })

      if (!res.ok) throw new Error("Failed to reject")
      alert("تم رفض التفريغ وإرسال الملاحظات للمفرغ.")
      router.push("/admin/transcription")
    } catch (e) {
      console.error(e)
      alert("حدث خطأ أثناء المراجعة.")
    }
  }

  return (
    <div className="animate-slide-up stagger-1">
      <TranscriptionEditor
        taskId={taskId}
        audioUrl={audioUrl}
        initialSegments={initialSegments}
        speakerCount={speakerCount}
        isReviewMode={isReadOnly}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
