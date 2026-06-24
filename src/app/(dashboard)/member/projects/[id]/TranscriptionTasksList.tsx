"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Headphones, CheckCircle, Clock } from "lucide-react"

export function TranscriptionTasksList({ tasks, currentUserId, teamRole, teamLeaderId }: { tasks: any[], currentUserId: string, teamRole?: string | null, teamLeaderId?: string | null }) {
  const router = useRouter()
  const [claimingId, setClaimingId] = React.useState<string | null>(null)

  const handleClaim = async (taskId: string) => {
    setClaimingId(taskId)
    try {
      const res = await fetch(`/api/transcription/${taskId}/claim`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to claim")
      }
      // Redirect to editor
      router.push(`/member/transcription/${taskId}`)
    } catch (e: any) {
      alert(e.message)
      setClaimingId(null)
    }
  }

  // Find if user already has an active task in this project
  const myActiveTask = tasks.find(t => t.assignedToId === currentUserId || t.qcAssignedToId === currentUserId)

  const isQC = teamRole === "QC"

  // Filter tasks based on role
  const availableTasks = tasks.filter(t => {
    if (t.assignedToId === currentUserId || t.qcAssignedToId === currentUserId) return true // Show my active task
    if (isQC) {
      return t.status === "SUBMITTED_TO_QC" && t.teamId === teamLeaderId
    } else {
      return t.status === "AVAILABLE" || t.status === "REJECTED"
    }
  })

  return (
    <div className="glass p-6 rounded-2xl border border-primary/20 bg-primary/5 mb-8">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Headphones className="w-6 h-6 text-primary" />
        {isQC ? "Tasks Ready for Quality Control" : "Available Transcription Tasks"}
      </h3>
      
      {myActiveTask ? (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="font-bold text-green-600 dark:text-green-400 mb-2">You currently have an active task!</p>
          <button 
            onClick={() => router.push(`/member/transcription/${myActiveTask.id}`)}
            className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {isQC ? `Review Active Task` : `Resume Transcription`}
          </button>
        </div>
      ) : availableTasks.length > 0 ? (
        <div className="text-center p-8 bg-background border border-border rounded-xl">
          <p className="text-foreground/70 mb-6 font-bold text-lg">
            {isQC ? "There are tasks waiting for Quality Control." : "There are new transcription tasks available."}
          </p>
          <button
            onClick={() => handleClaim(availableTasks[0].id)}
            disabled={claimingId !== null}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-black text-xl transition-all shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed mx-auto block"
          >
            {claimingId !== null ? "Claiming..." : "سحب تسك (Claim Task)"}
          </button>
        </div>
      ) : (
        <div className="text-center p-8 text-foreground/50 border border-dashed border-border rounded-xl bg-background/50">
          <p className="font-bold text-lg mb-2">No tasks available</p>
          <p>All tasks have been claimed or none are ready yet.</p>
        </div>
      )}
    </div>
  )
}
