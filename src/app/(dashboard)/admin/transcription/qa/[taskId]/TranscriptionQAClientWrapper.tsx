"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TranscriptionEditor } from "@/components/transcription-editor"

export function TranscriptionQAClientWrapper({ taskId, audioUrl, initialSegments, speakerCount, isReadOnly }: any) {
  const router = useRouter()

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to finally approve this transcription?")) return
    try {
      const res = await fetch(`/api/transcription/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", notes: "" })
      })

      if (!res.ok) throw new Error("Failed to approve")
      alert("Transcription approved successfully!")
      router.push("/admin/transcription")
    } catch (e) {
      console.error(e)
      alert("An error occurred during review.")
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
      alert("Transcription rejected and feedback sent to the transcriber.")
      router.push("/admin/transcription")
    } catch (e) {
      console.error(e)
      alert("An error occurred during review.")
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
        onReviewApprove={handleApprove}
        onReviewReject={handleReject}
      />
    </div>
  )
}
