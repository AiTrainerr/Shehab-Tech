"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TranscriptionEditor } from "@/components/transcription-editor"

export function TranscriptionClientWrapper({ taskId, audioUrl, initialSegments, speakerCount, isReadOnly, isQC }: any) {
  const router = useRouter()

  const handleSave = async (segments: any[]) => {
    try {
      const res = await fetch(`/api/transcription/${taskId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments })
      })

      if (!res.ok) throw new Error("Failed to save")
      
      // Optional: show toast notification
      alert("Saved successfully!")
    } catch (e) {
      console.error(e)
      alert("An error occurred while saving.")
    }
  }

  const handleSubmit = async () => {
    if (!confirm(isQC ? "Submit to Admin QA?" : "Submit this task?")) return;
    try {
      const res = await fetch(`/api/transcription/${taskId}/submit`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to submit")
      alert("Submitted successfully!")
      router.push("/member")
    } catch (e) {
      console.error(e)
      alert("An error occurred while submitting.")
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
        onSave={isReadOnly ? undefined : handleSave}
        onSubmit={isReadOnly ? undefined : handleSubmit}
        isQC={isQC}
      />
    </div>
  )
}
