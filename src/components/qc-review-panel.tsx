"use client"

import * as React from "react"
import { Play, Square, Check, X, RotateCcw, ShieldAlert, FileAudio, Clock, Activity, MessageSquare } from "lucide-react"
import { reviewVoiceRecording } from "@/app/actions/recordings"

type Recording = {
  id: string
  fileUrl: string
  audioFormat: string
  sampleRate: number
  bitDepth: number
  channels: string
  fileSize: number
  duration: number
  status: string
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  }
  sentence: {
    text: string
    project: {
      title: string
    }
  }
}

export function QcReviewPanel({ initialRecordings }: { initialRecordings: Recording[] }) {
  const [recordings, setRecordings] = React.useState<Recording[]>(initialRecordings)
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [selectedRec, setSelectedRec] = React.useState<Recording | null>(null)
  const [modalType, setModalType] = React.useState<"REJECTED" | "NEED_RE_RECORD" | null>(null)
  const [reasonText, setReasonText] = React.useState("")
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingUrl === url) {
      setPlayingUrl(null)
      return
    }
    const audio = new Audio(url)
    audio.onended = () => setPlayingUrl(null)
    audio.play()
    audioRef.current = audio
    setPlayingUrl(url)
  }

  const handleAction = async (recId: string, status: "ACCEPTED" | "REJECTED" | "NEED_RE_RECORD", reason?: string) => {
    setLoadingId(recId)
    const res = await reviewVoiceRecording(recId, status, reason)
    setLoadingId(null)
    if (res.success) {
      setRecordings(prev => prev.filter(r => r.id !== recId))
      setModalType(null)
      setSelectedRec(null)
      setReasonText("")
    } else {
      alert(res.error || "Failed to update status")
    }
  }

  const openReasonModal = (rec: Recording, type: "REJECTED" | "NEED_RE_RECORD") => {
    setSelectedRec(rec)
    setModalType(type)
  }

  return (
    <div className="space-y-6">
      {recordings.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-border text-center">
          <Activity className="w-12 h-12 text-primary/40 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-foreground">All caught up!</h3>
          <p className="text-sm text-foreground/60 mt-1">There are currently no recordings pending quality control review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {recordings.map((rec) => {
            const isPlaying = playingUrl === rec.fileUrl
            const isLoading = loadingId === rec.id

            return (
              <div key={rec.id} className="glass p-6 rounded-2xl border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-primary/30 transition-all">
                <div className="flex-1 space-y-4">
                  {/* Title & user info */}
                  <div>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase">
                      {rec.sentence.project.title}
                    </span>
                    <h4 className="text-lg font-bold text-foreground mt-2">{rec.sentence.text}</h4>
                    <p className="text-xs text-foreground/60 mt-1">
                      Submitted by <strong className="text-foreground">{rec.user.firstName} {rec.user.lastName}</strong> ({rec.user.email}) • {new Date(rec.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Audio metadata specifications specs */}
                  <div className="flex flex-wrap gap-3 text-xs font-semibold text-foreground/75">
                    <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-lg border border-border">
                      <FileAudio className="w-3.5 h-3.5 text-primary" /> {rec.audioFormat}
                    </span>
                    <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-lg border border-border">
                      {rec.sampleRate} Hz
                    </span>
                    <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-lg border border-border">
                      {rec.bitDepth}-bit
                    </span>
                    <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-lg border border-border">
                      {rec.channels}
                    </span>
                    <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-lg border border-border">
                      <Clock className="w-3.5 h-3.5 text-primary" /> {rec.duration.toFixed(1)}s
                    </span>
                    <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-lg border border-border">
                      {(rec.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                {/* Review Play/Approve/Reject actions */}
                <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                  <button
                    onClick={() => playAudio(rec.fileUrl)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl transition-all text-sm
                      ${isPlaying ? "bg-primary text-white" : "bg-card border border-border hover:bg-primary/10 hover:text-primary"}`}
                  >
                    {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "Stop" : "Listen"}
                  </button>

                  <button
                    onClick={() => handleAction(rec.id, "ACCEPTED")}
                    disabled={isLoading}
                    className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors disabled:opacity-40"
                    title="Accept Recording"
                  >
                    <Check className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => openReasonModal(rec, "NEED_RE_RECORD")}
                    disabled={isLoading}
                    className="p-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors disabled:opacity-40"
                    title="Request Re-recording"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => openReasonModal(rec, "REJECTED")}
                    disabled={isLoading}
                    className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-40"
                    title="Reject Recording"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rejection / Need Re-record feedback Modal */}
      {modalType && selectedRec && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-6 rounded-3xl border border-border space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-6 h-6 text-primary" />
              {modalType === "REJECTED" ? "Reject Recording" : "Request Re-recording"}
            </h3>
            
            <p className="text-sm text-foreground/70">
              Provide feedback or instructions explaining why this recording is rejected or needs to be re-recorded.
            </p>

            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full h-24 p-3 rounded-xl bg-background border border-border outline-none focus:border-primary transition-colors text-sm"
              placeholder="e.g. background noise detected, incorrect sentence pronunciation..."
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setModalType(null); setSelectedRec(null); setReasonText(""); }}
                className="px-4 py-2 text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(selectedRec.id, modalType, reasonText)}
                disabled={!reasonText.trim()}
                className="px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-40"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
