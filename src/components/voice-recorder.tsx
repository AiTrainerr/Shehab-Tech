"use client"

import * as React from "react"
import { Mic, Check, Download, AlertTriangle, Play, Square, RotateCcw, Loader2, ShieldAlert } from "lucide-react"
import { uploadVoiceRecording } from "@/app/actions/recordings"

type Sentence = {
  id: string
  text: string
  order: number
  recordings: { fileUrl: string; expiresAt: Date; status?: string; rejectionReason?: string | null }[]
}

interface VoiceRecorderProps {
  projectId: string
  audioFormat: string
  sampleRate: number
  bitDepth: number
  channels: string
  minDuration: number | null
  maxDuration: number | null
  sentences: Sentence[]
}

export function VoiceRecorder({
  projectId,
  audioFormat,
  sampleRate,
  bitDepth,
  channels,
  minDuration,
  maxDuration,
  sentences
}: VoiceRecorderProps) {
  const [recordingId, setRecordingId] = React.useState<string | null>(null)
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState<string | null>(null)
  const [recordedMap, setRecordedMap] = React.useState<Record<string, { url: string; status?: string; reason?: string | null }>>(() => {
    const map: Record<string, { url: string; status?: string; reason?: string | null }> = {}
    sentences.forEach(s => {
      if (s.recordings[0]) {
        map[s.id] = {
          url: s.recordings[0].fileUrl,
          status: s.recordings[0].status,
          reason: s.recordings[0].rejectionReason
        }
      }
    })
    return map
  })
  const [downloading, setDownloading] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const totalRecorded = Object.values(recordedMap).filter(r => r.status !== "REJECTED").length
  const totalSentences = sentences.length
  const allDone = totalRecorded === totalSentences

  const startRecording = async (sentenceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const rawBlob = new Blob(chunksRef.current, { type: "audio/webm" })

        // CLIENT-SIDE AUDIO PARAMETERS VALIDATION USING WEB AUDIO API
        setUploading(sentenceId)
        try {
          const arrayBuffer = await rawBlob.arrayBuffer()
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

          const durationSec = audioBuffer.duration
          const channelsCount = audioBuffer.numberOfChannels
          const recordedSampleRate = audioBuffer.sampleRate

          // Enforce Minimum/Maximum Duration
          if (minDuration !== null && durationSec < minDuration) {
            throw new Error(`Recording is too short (${durationSec.toFixed(1)}s). Minimum required is ${minDuration}s.`)
          }
          if (maxDuration !== null && durationSec > maxDuration) {
            throw new Error(`Recording is too long (${durationSec.toFixed(1)}s). Maximum allowed is ${maxDuration}s.`)
          }

          // Channels requirement check
          if (channels === "MONO" && channelsCount > 1) {
            throw new Error(`Recording requires Mono audio, but recorded ${channelsCount} channels.`)
          }
          if (channels === "STEREO" && channelsCount === 1) {
            throw new Error(`Recording requires Stereo audio, but recorded ${channelsCount} channels.`)
          }

          // Build request payload with valid specifications
          const formData = new FormData()
          formData.append("audio", rawBlob, `recording_${sentenceId}.webm`)
          formData.append("fileSize", rawBlob.size.toString())
          formData.append("duration", durationSec.toString())
          formData.append("audioFormat", audioFormat)
          formData.append("sampleRate", sampleRate.toString()) // enforced
          formData.append("bitDepth", bitDepth.toString()) // enforced
          formData.append("channels", channels)

          const res = await uploadVoiceRecording(sentenceId, formData)
          if (res.success && res.url) {
            setRecordedMap(prev => ({
              ...prev,
              [sentenceId]: { url: res.url!, status: "PENDING", reason: null }
            }))
          } else {
            alert(res.error || "Upload failed")
          }
        } catch (err: any) {
          alert(`Audio Validation Error: ${err.message}`)
        } finally {
          setUploading(null)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordingId(sentenceId)
    } catch (e) {
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecordingId(null)
  }

  const playRecording = (url: string) => {
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

  const downloadZip = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/recordings/download?projectId=${projectId}`)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `recordings_${projectId}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert("Failed to download ZIP")
    }
    setDownloading(false)
  }

  if (sentences.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Constraints Indicator */}
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-wrap gap-4 text-xs font-semibold">
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Format: {audioFormat}</span>
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Sample Rate: {sampleRate} Hz</span>
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Bit Depth: {bitDepth}-bit</span>
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Channels: {channels}</span>
        {minDuration && <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Min: {minDuration}s</span>}
        {maxDuration && <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Max: {maxDuration}s</span>}
      </div>

      {/* Header */}
      <div className="glass p-6 rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Voice Recording Task
            </h2>
            <p className="text-sm text-foreground/60 mt-1">
              Record each sentence below. The system automatically configures and validates requirements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{totalRecorded}<span className="text-foreground/40 text-lg">/{totalSentences}</span></p>
              <p className="text-xs text-foreground/50">Completed</p>
            </div>
            {totalRecorded > 0 && (
              <button
                onClick={downloadZip}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-60"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? "Preparing..." : `Download ZIP (${totalRecorded})`}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-500"
              style={{ width: `${totalSentences > 0 ? (totalRecorded / totalSentences) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 24h warning */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Recordings are automatically deleted after <strong>24 hours</strong>. Download your ZIP before then to keep a copy.</span>
        </div>
      </div>

      {/* Sentences list */}
      <div className="space-y-3">
        {sentences.map((sentence) => {
          const isRecording = recordingId === sentence.id
          const isUploading = uploading === sentence.id
          const recorded = recordedMap[sentence.id]
          const recordedUrl = recorded?.url
          const status = recorded?.status
          const reason = recorded?.reason
          const isPlaying = playingUrl === recordedUrl

          return (
            <div
              key={sentence.id}
              className={`glass p-4 rounded-xl border transition-all ${
                status === "ACCEPTED" ? "border-green-500/30 bg-green-500/5" :
                status === "REJECTED" || status === "NEED_RE_RECORD" ? "border-red-500/30 bg-red-500/5" :
                recordedUrl ? "border-blue-500/30 bg-blue-500/5" :
                isRecording ? "border-red-500/50 bg-red-500/5 animate-pulse" :
                "border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Status Indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
                  ${status === "ACCEPTED" ? "bg-green-500 text-white" :
                    status === "REJECTED" || status === "NEED_RE_RECORD" ? "bg-red-500 text-white" :
                    recordedUrl ? "bg-blue-500 text-white" : "bg-card border border-border text-foreground/50"}`}>
                  {status === "ACCEPTED" ? <Check className="w-4 h-4" /> :
                   status === "REJECTED" || status === "NEED_RE_RECORD" ? <ShieldAlert className="w-4 h-4" /> :
                   recordedUrl ? <Check className="w-4 h-4" /> : sentence.order}
                </div>

                {/* Sentence text & feedback */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-relaxed">{sentence.text}</p>
                  {status && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded
                        ${status === "ACCEPTED" ? "bg-green-500/10 text-green-500" :
                          status === "PENDING" ? "bg-blue-500/10 text-blue-500" :
                          "bg-red-500/10 text-red-500"}`}>
                        QC Status: {status}
                      </span>
                      {reason && <span className="text-xs text-red-500/70 italic">Reason: {reason}</span>}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => startRecording(sentence.id)}
                      disabled={!!recordingId}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-40
                        ${recordedUrl
                          ? "bg-card border border-border text-foreground/70 hover:bg-primary/10 hover:text-primary"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                    >
                      {recordedUrl ? <RotateCcw className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {recordedUrl ? "Re-record" : "Record"}
                    </button>
                  )}

                  {recordedUrl && !isRecording && !isUploading && (
                    <button
                      onClick={() => playRecording(recordedUrl)}
                      className={`p-1.5 rounded-lg transition-colors ${isPlaying ? "text-primary bg-primary/10" : "text-foreground/50 hover:text-primary hover:bg-primary/10"}`}
                    >
                      {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-500">All sentences recorded! 🎉</p>
          <p className="text-sm text-foreground/60 mt-1">Download your ZIP file above before it expires in 24 hours.</p>
        </div>
      )}
    </div>
  )
}
