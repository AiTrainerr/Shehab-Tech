"use client"

import * as React from "react"
import { CheckCircle, Clock, AlertCircle, PlayCircle } from "lucide-react"
import Link from "next/link"

interface Task {
  id: string
  status: string
  duration: number | null
  assignedToId: string | null
}

export function FreelancerTranscriptionStats({ 
  tasks, 
  currentUserId 
}: { 
  tasks: Task[]
  currentUserId: string
}) {
  const myTasks = tasks.filter(t => t.assignedToId === currentUserId)

  // 1. Submitted / Valid Tasks (not ASSIGNED, not AVAILABLE, not REJECTED)
  const completedTasks = myTasks.filter(t => 
    ["SUBMITTED_TO_QC", "UNDER_QC_REVIEW", "APPROVED_BY_QC", "APPROVED"].includes(t.status)
  )
  const completedTasksDuration = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0)

  // 2. Accepted Tasks
  const acceptedTasks = myTasks.filter(t => 
    ["APPROVED_BY_QC", "APPROVED"].includes(t.status)
  )
  const acceptedTasksDuration = acceptedTasks.reduce((sum, t) => sum + (t.duration || 0), 0)

  // 3. Rejected Tasks (To be redone)
  const rejectedTasks = myTasks.filter(t => t.status === "REJECTED")

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xl font-bold text-foreground">My Transcription Progress</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Completed */}
        <div className="glass p-4 rounded-xl border border-border">
          <p className="text-sm text-foreground/60 font-semibold mb-1">Submitted Tasks</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{completedTasks.length}</span>
            <span className="text-xs text-foreground/50">tasks</span>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-border">
          <p className="text-sm text-foreground/60 font-semibold mb-1">Submitted Hours</p>
          <div className="flex items-baseline gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{formatDuration(completedTasksDuration)}</span>
          </div>
        </div>

        {/* Accepted */}
        <div className="glass p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <p className="text-sm text-green-600/80 dark:text-green-400/80 font-semibold mb-1">Accepted Tasks</p>
          <div className="flex items-baseline gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-black text-green-600 dark:text-green-400">{acceptedTasks.length}</span>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <p className="text-sm text-green-600/80 dark:text-green-400/80 font-semibold mb-1">Accepted Hours</p>
          <div className="flex items-baseline gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatDuration(acceptedTasksDuration)}</span>
          </div>
        </div>
      </div>

      {/* Rejected Tasks Action Section */}
      {rejectedTasks.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-600 dark:text-red-400 text-lg">Action Required</h4>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">
                You have {rejectedTasks.length} task(s) that require edits (To be redone).
              </p>
            </div>
          </div>
          <Link 
            href={`/member/transcription/${rejectedTasks[0].id}`}
            className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            <PlayCircle className="w-5 h-5" />
            إعادة المهام المرفوضة (Redo)
          </Link>
        </div>
      )}
    </div>
  )
}
