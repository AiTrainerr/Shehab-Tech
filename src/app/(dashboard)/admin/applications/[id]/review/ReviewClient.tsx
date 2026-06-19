"use client"

import * as React from "react"
import { Check, X, Play, Square, Loader2, AlertTriangle, Download, Save, ChevronDown, ChevronUp } from "lucide-react"
import { saveBulkReview } from "@/app/actions/recordings"
import { useRouter } from "next/navigation"

type Decision = {
  recordingId: string
  status: "ACCEPTED" | "NEED_RE_RECORD" | null
  reason: string
}

export function ReviewClient({ application, sentences }: { application: any; sentences: any[] }) {
  const router = useRouter()
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [expandedReason, setExpandedReason] = React.useState<string | null>(null)

  // Initialize decisions from existing DB statuses
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>(() => {
    const map: Record<string, Decision> = {}
    sentences.forEach((s) => {
      const rec = s.recordings[0]
      if (rec) {
        map[rec.id] = {
          recordingId: rec.id,
          status: (rec.status === "ACCEPTED" || rec.status === "NEED_RE_RECORD") ? rec.status : null,
          reason: rec.rejectionReason || ""
        }
      }
    })
    return map
  })

  const setStatus = (recordingId: string, status: "ACCEPTED" | "NEED_RE_RECORD" | null) => {
    setDecisions(prev => ({
      ...prev,
      [recordingId]: { ...prev[recordingId], recordingId, status }
    }))
    // Auto-expand reason field when rejecting
    if (status === "NEED_RE_RECORD") setExpandedReason(recordingId)
    else if (expandedReason === recordingId) setExpandedReason(null)
  }

  const setReason = (recordingId: string, reason: string) => {
    setDecisions(prev => ({
      ...prev,
      [recordingId]: { ...prev[recordingId], recordingId, reason }
    }))
  }

  const handleBatchDecision = (status: "ACCEPTED" | "NEED_RE_RECORD") => {
    const updated: Record<string, Decision> = { ...decisions }
    sentences.forEach((s) => {
      const rec = s.recordings[0]
      if (rec) {
        updated[rec.id] = {
          recordingId: rec.id,
          status,
          reason: updated[rec.id]?.reason || ""
        }
      }
    })
    setDecisions(updated)
    if (status === "NEED_RE_RECORD") setExpandedReason("ALL")
    else setExpandedReason(null)
  }

  const handleSave = async () => {
    const pending = Object.values(decisions).filter(d => d.status !== null) as (Decision & { status: "ACCEPTED" | "NEED_RE_RECORD" })[]

    if (pending.length === 0) {
      alert("Please mark at least one recording as Accepted or Needs Re-record before saving.")
      return
    }

    // Validate: rejected ones must have a reason
    const missingReason = pending.filter(d => d.status === "NEED_RE_RECORD" && !d.reason.trim())
    if (missingReason.length > 0) {
      alert(`Please provide a rejection reason for ${missingReason.length} recording(s) marked as "Needs Re-record".`)
      setExpandedReason(missingReason[0].recordingId)
      return
    }

    setSaving(true)
    const res = await saveBulkReview(
      application.id,
      pending.map(d => ({ recordingId: d.recordingId, status: d.status, reason: d.reason }))
    )
    setSaving(false)

    if (!res.success) {
      alert("Error saving reviews: " + res.error)
    } else {
      router.refresh()
    }
  }

  const reviewedCount = Object.values(decisions).filter(d => d.status !== null).length
  const totalWithRecording = sentences.filter(s => s.recordings[0]).length
  const allReviewed = reviewedCount === totalWithRecording && totalWithRecording > 0

  return (
    <div className="space-y-6">
      {/* Batch Actions Bar */}
      <div className="glass p-5 rounded-2xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Batch Actions</h3>
          <p className="text-sm text-foreground/60">
            Mark all as accepted or needs re-record at once.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleBatchDecision("NEED_RE_RECORD")}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all text-sm"
          >
            ✕ Reject All
          </button>
          <button
            onClick={() => handleBatchDecision("ACCEPTED")}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-green-500/10 text-green-500 font-bold rounded-xl hover:bg-green-500/20 transition-all text-sm"
          >
            ✓ Accept All
          </button>
        </div>
      </div>

      {/* Download ZIP */}
      <div className="glass p-5 rounded-2xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Download Files</h3>
          <p className="text-sm text-foreground/60">Download all user recordings as a ZIP.</p>
        </div>
        <button
          onClick={() => {
            window.open(`/api/recordings/download?projectId=${application.projectId}&userId=${application.userId}`, "_blank")
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:border-primary/50 text-foreground font-bold rounded-xl transition-all text-sm"
        >
          <Download className="w-4 h-4" /> Download ZIP
        </button>
      </div>

      {/* Sentences List */}
      <div className="space-y-3">
        {sentences.map((s) => {
          const recording = s.recordings[0]
          if (!recording) {
            return (
              <div key={s.id} className="glass p-5 rounded-2xl border border-border flex items-center gap-4 opacity-60">
                <div className="w-10 h-10 shrink-0 bg-border text-foreground/40 font-black rounded-xl flex items-center justify-center text-sm">
                  {s.order}
                </div>
                <p className="flex-1 text-sm text-foreground/70">{s.text}</p>
                <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" /> Not recorded
                </div>
              </div>
            )
          }

          const decision = decisions[recording.id]
          const isAccepted = decision?.status === "ACCEPTED"
          const isRejected = decision?.status === "NEED_RE_RECORD"
          const isExpanded = expandedReason === recording.id || expandedReason === "ALL"

          return (
            <div
              key={s.id}
              className={`glass p-5 rounded-2xl border transition-all ${
                isAccepted ? "border-green-500/30 bg-green-500/5" :
                isRejected ? "border-red-500/30 bg-red-500/5" :
                "border-border"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Order Badge */}
                <div className={`w-10 h-10 shrink-0 font-black rounded-xl flex items-center justify-center text-sm ${
                  isAccepted ? "bg-green-500/20 text-green-500" :
                  isRejected ? "bg-red-500/20 text-red-500" :
                  "bg-primary/10 text-primary"
                }`}>
                  {s.order}
                </div>

                {/* Sentence Text + Play */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-2 leading-relaxed">{s.text}</p>
                  <button
                    onClick={() => setPlayingUrl(playingUrl === recording.fileUrl ? null : recording.fileUrl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg hover:border-primary transition-colors text-xs font-bold"
                  >
                    {playingUrl === recording.fileUrl
                      ? <><Square className="w-3 h-3 text-primary" /> Stop</>
                      : <><Play className="w-3 h-3 text-primary" /> Play</>
                    }
                  </button>
                </div>

                {/* Decision Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <button
                    onClick={() => setStatus(recording.id, isRejected ? null : "NEED_RE_RECORD")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isRejected
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    }`}
                    title="Needs Re-record"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Reject</span>
                  </button>
                  <button
                    onClick={() => setStatus(recording.id, isAccepted ? null : "ACCEPTED")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isAccepted
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                        : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    }`}
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Accept</span>
                  </button>

                  {/* Toggle reason field */}
                  {isRejected && (
                    <button
                      onClick={() => setExpandedReason(isExpanded ? null : recording.id)}
                      className="p-2.5 bg-card border border-border rounded-xl hover:border-red-500/30 transition-colors"
                      title="Add/Edit rejection reason"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/50" /> : <ChevronDown className="w-4 h-4 text-foreground/50" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection Reason Input – shown when rejected & expanded */}
              {isRejected && isExpanded && (
                <div className="mt-4 pt-4 border-t border-red-500/20">
                  <label className="text-xs font-bold text-red-500 mb-1.5 block">
                    Reason for rejection <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={decision?.reason || ""}
                    onChange={(e) => setReason(recording.id, e.target.value)}
                    placeholder="e.g. Too much background noise, unclear pronunciation..."
                    className="w-full px-4 py-2.5 bg-background border border-red-500/30 rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              )}

              {/* Audio player */}
              {playingUrl === recording.fileUrl && (
                <audio src={recording.fileUrl} autoPlay onEnded={() => setPlayingUrl(null)} className="hidden" />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress & Save Bar */}
      <div className="glass p-5 rounded-2xl border border-border sticky bottom-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-bold text-foreground">{reviewedCount}</span>
            <span className="text-foreground/50"> / {totalWithRecording} reviewed</span>
            {!allReviewed && (
              <span className="ml-2 text-yellow-500 text-xs font-semibold">
                ({totalWithRecording - reviewedCount} remaining)
              </span>
            )}
            {allReviewed && (
              <span className="ml-2 text-green-500 text-xs font-semibold">✓ All reviewed</span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || reviewedCount === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save All Reviews"}
          </button>
        </div>
        <p className="text-xs text-foreground/40 mt-2 text-center sm:text-left">
          The freelancer will be notified only after you click "Save All Reviews".
        </p>
      </div>
    </div>
  )
}
