"use client"

import * as React from "react"
import { Mic, MicOff, Check, Download, AlertTriangle, Play, Square, RotateCcw, Loader2 } from "lucide-react"
import { uploadVoiceRecording } from "@/app/actions/recordings"

type Sentence = {
  id: string
  text: string
  order: number
  recordings: { fileUrl: string; expiresAt: Date }[]
}

export function VoiceRecorder({ projectId, sentences }: { projectId: string; sentences: Sentence[] }) {
  const [recordingId, setRecordingId] = React.useState<string | null>(null)
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState<string | null>(null)
  const [recordedMap, setRecordedMap] = React.useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    sentences.forEach(s => { if (s.recordings[0]) map[s.id] = s.recordings[0].fileUrl })
    return map
  })
  const [downloading, setDownloading] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const totalRecorded = Object.keys(recordedMap).length
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
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const formData = new FormData()
        formData.append("audio", blob, `recording_${sentenceId}.webm`)

        setUploading(sentenceId)
        const res = await uploadVoiceRecording(sentenceId, formData)
        setUploading(null)

        if (res.success && res.url) {
          setRecordedMap(prev => ({ ...prev, [sentenceId]: res.url! }))
        } else {
          alert(res.error || "Upload failed")
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
      {/* Header */}
      <div className="glass p-6 rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Voice Recording Task
            </h2>
            <p className="text-sm text-foreground/60 mt-1">
              Record each sentence below. You can re-record any sentence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{totalRecorded}<span className="text-foreground/40 text-lg">/{totalSentences}</span></p>
              <p className="text-xs text-foreground/50">Recorded</p>
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
          const recordedUrl = recordedMap[sentence.id]
          const isPlaying = playingUrl === recordedUrl

          return (
            <div
              key={sentence.id}
              className={`glass p-4 rounded-xl border transition-all ${
                recordedUrl ? "border-green-500/30 bg-green-500/5" :
                isRecording ? "border-red-500/50 bg-red-500/5 animate-pulse" :
                "border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Order number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
                  ${recordedUrl ? "bg-green-500 text-white" : "bg-card border border-border text-foreground/50"}`}>
                  {recordedUrl ? <Check className="w-4 h-4" /> : sentence.order}
                </div>

                {/* Sentence text */}
                <p className="flex-1 text-sm font-medium leading-relaxed">{sentence.text}</p>

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
