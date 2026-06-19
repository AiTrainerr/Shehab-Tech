"use client"

import * as React from "react"
import { Check, X, Play, Square, Loader2, AlertTriangle, Download, Send } from "lucide-react"
import { reviewVoiceRecording, reviewAllRecordings, generateProjectZipUrl } from "@/app/actions/recordings"
import { useRouter } from "next/navigation"

export function ReviewClient({ application, sentences }: { application: any, sentences: any[] }) {
  const router = useRouter()
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [globalLoading, setGlobalLoading] = React.useState(false)
  const [zipUrl, setZipUrl] = React.useState<string | null>(null)

  const handleReviewSingle = async (recordingId: string, status: "ACCEPTED" | "NEED_RE_RECORD") => {
    let reason = ""
    if (status === "NEED_RE_RECORD") {
      const input = prompt("Please provide a reason for rejection (e.g. Too much background noise):")
      if (input === null) return // Cancelled
      reason = input
    } else {
      if (!confirm("Approve this sentence?")) return
    }

    setLoadingId(recordingId)
    const res = await reviewVoiceRecording(recordingId, status, reason)
    if (!res.success) alert(res.error)
    setLoadingId(null)
    router.refresh()
  }

  const handleReviewAll = async (action: "APPROVE_ALL" | "REJECT_ALL") => {
    let reason = ""
    if (action === "REJECT_ALL") {
      const input = prompt("Reason for rejecting all recordings:")
      if (input === null) return
      reason = input
    } else {
      if (!confirm("Are you sure you want to approve ALL recordings for this freelancer? This will mark the application as APPROVED.")) return
    }

    setGlobalLoading(true)
    const res = await reviewAllRecordings(application.id, action, reason)
    if (!res.success) alert(res.error)
    setGlobalLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Global Actions */}
      <div className="glass p-6 rounded-2xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Batch Actions</h3>
          <p className="text-sm text-foreground/60">Approve or reject all recordings at once.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleReviewAll("REJECT_ALL")}
            disabled={globalLoading}
            className="flex-1 sm:flex-none px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            Reject All
          </button>
          <button
            onClick={() => handleReviewAll("APPROVE_ALL")}
            disabled={globalLoading}
            className="flex-1 sm:flex-none px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
          >
            Approve All
          </button>
        </div>
      </div>

      {/* ZIP Download Section */}
      <div className="glass p-6 rounded-2xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Download Files</h3>
          <p className="text-sm text-foreground/60">Download all user recordings in a ZIP file.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={async () => {
              setGlobalLoading(true)
              const res = await generateProjectZipUrl(application.projectId, application.userId)
              if (res.success && res.url) {
                setZipUrl(res.url)
                window.open(res.url, "_blank")
              } else {
                alert("Could not generate ZIP: " + res.error)
              }
              setGlobalLoading(false)
            }}
            disabled={globalLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border hover:border-primary/50 text-foreground font-bold rounded-xl transition-all"
          >
            {globalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download ZIP
          </button>
        </div>
      </div>

      {/* Sentences List */}
      <div className="space-y-4">
        {sentences.map((s) => {
          const recording = s.recordings[0]
          return (
            <div key={s.id} className="glass p-6 rounded-2xl border border-border relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary font-black rounded-xl flex items-center justify-center">
                  {s.order}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-foreground mb-2">{s.text}</p>
                  
                  {recording ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <button
                        onClick={() => setPlayingUrl(playingUrl === recording.fileUrl ? null : recording.fileUrl)}
                        className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl hover:border-primary transition-colors text-sm font-bold"
                      >
                        {playingUrl === recording.fileUrl ? <Square className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                        {playingUrl === recording.fileUrl ? "Stop" : "Play Recording"}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          recording.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          recording.status === 'NEED_RE_RECORD' || recording.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {recording.status}
                        </span>
                      </div>
                      
                      {recording.status === 'NEED_RE_RECORD' && recording.rejectionReason && (
                        <p className="text-xs text-red-500">Reason: {recording.rejectionReason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg w-fit">
                      <AlertTriangle className="w-4 h-4" /> Not recorded yet
                    </div>
                  )}
                </div>

                {recording && (
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button
                      onClick={() => handleReviewSingle(recording.id, "NEED_RE_RECORD")}
                      disabled={loadingId === recording.id || recording.status === "NEED_RE_RECORD"}
                      className="flex-1 md:flex-none p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors disabled:opacity-50 flex justify-center"
                      title="Reject / Request Re-record"
                    >
                      {loadingId === recording.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleReviewSingle(recording.id, "ACCEPTED")}
                      disabled={loadingId === recording.id || recording.status === "ACCEPTED"}
                      className="flex-1 md:flex-none p-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-xl transition-colors disabled:opacity-50 flex justify-center"
                      title="Approve"
                    >
                      {loadingId === recording.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>
              
              {playingUrl === recording?.fileUrl && (
                <audio src={recording.fileUrl} autoPlay onEnded={() => setPlayingUrl(null)} className="hidden" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
