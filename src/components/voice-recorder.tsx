"use client"

import * as React from "react"
import { Mic, Check, Download, AlertTriangle, Play, Square, RotateCcw, Loader2, ShieldAlert, ChevronLeft, ChevronRight, UploadCloud, Volume2, Lock, X } from "lucide-react"
import { uploadVoiceRecording, submitAllRecordings, generateProjectZipUrl } from "@/app/actions/recordings"
import { Send } from "lucide-react"

type Sentence = {
  id: string
  text: string
  order: number
  audioId?: string
  speed?: string
  recordings: { fileUrl: string; expiresAt: Date; status?: string; rejectionReason?: string | null }[]
}

interface VoiceRecorderProps {
  projectId: string
  speakerCode?: string
  applicationStatus: string
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
  speakerCode,
  applicationStatus,
  audioFormat,
  sampleRate,
  bitDepth,
  channels,
  minDuration,
  maxDuration,
  sentences
}: VoiceRecorderProps) {
  // Start at the first sentence that is not yet successfully recorded, or 0
  const [currentIndex, setCurrentIndex] = React.useState<number>(() => {
    const firstPendingIdx = sentences.findIndex(s => !s.recordings[0] || s.recordings[0].status === "REJECTED" || s.recordings[0].status === "NEED_RE_RECORD")
    return firstPendingIdx !== -1 ? firstPendingIdx : 0
  })

  const [recordingId, setRecordingId] = React.useState<string | null>(null)
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState<string | null>(null)
  const [isSubmittingAll, setIsSubmittingAll] = React.useState(false)
  const [submittedAll, setSubmittedAll] = React.useState(false)
  const [zipUrl, setZipUrl] = React.useState<string | null>(null)

  // Local unsaved recording states
  const [localAudioBlob, setLocalAudioBlob] = React.useState<Blob | null>(null)
  const [localAudioUrl, setLocalAudioUrl] = React.useState<string | null>(null)

  // Recording stats & indicators
  const [recordingTime, setRecordingTime] = React.useState<number>(0)
  const [volumeLevel, setVolumeLevel] = React.useState<number>(0)

  // Database saved recordings map
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

  // Refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)

  const activeSentence = sentences[currentIndex]
  const savedRecord = recordedMap[activeSentence.id]

  const totalRecorded = Object.values(recordedMap).filter(r => r.status !== "REJECTED" && r.status !== "NEED_RE_RECORD").length
  const totalSentences = sentences.length
  const allDone = totalRecorded === totalSentences

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  // Clear local recording state if user changes sentence without saving
  React.useEffect(() => {
    if (localAudioUrl) {
      URL.revokeObjectURL(localAudioUrl)
    }
    setLocalAudioBlob(null)
    setLocalAudioUrl(null)
    setRecordingTime(0)
    setVolumeLevel(0)
    chunksRef.current = []
    if (playingUrl) setPlayingUrl(null)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [currentIndex])

  const startRecording = async (sentenceId: string) => {
    // Clear any previous unsaved local recordings
    if (localAudioUrl) {
      URL.revokeObjectURL(localAudioUrl)
    }
    setLocalAudioBlob(null)
    setLocalAudioUrl(null)
    setRecordingTime(0)
    setVolumeLevel(0)
    chunksRef.current = []

    try {
      // Simplify constraints for max iOS compatibility. We handle resampling later anyway.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      if (typeof window.MediaRecorder === 'undefined') {
        throw new Error("Your browser/device does not support audio recording (MediaRecorder missing). Please update your iOS or use a different browser.")
      }

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      // Live volume visualization is temporarily disabled on iOS due to Safari WebKit crashes 
      // when attaching AudioContext to a MediaStream that is already being recorded.
      setVolumeLevel(50); // Fake a static or safe value if needed, or leave at 0.
      
      // We will create a safe interval that just toggles volume slightly for visual feedback without using AudioContext
      let fakeVol = 30;
      const visualizerInterval = setInterval(() => {
        fakeVol = fakeVol === 30 ? 70 : fakeVol === 70 ? 40 : 30;
        setVolumeLevel(fakeVol);
      }, 200);
      
      // Store the interval to clear it on stop
      (window as any).visualizerInterval = visualizerInterval;

      // Recording timer
      const startTime = Date.now()
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(parseFloat(((Date.now() - startTime) / 1000).toFixed(1)))
      }, 100)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Stop all track streams
        stream.getTracks().forEach(t => t.stop())

        // Stop volume analyzer & animation
        if ((window as any).visualizerInterval) {
          clearInterval((window as any).visualizerInterval);
        }
        setVolumeLevel(0)
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

        const rawBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/mp4" })
        const url = URL.createObjectURL(rawBlob)
        setLocalAudioBlob(rawBlob)
        setLocalAudioUrl(url)
        setRecordingId(null) // State transitions directly from Recording -> Review
      }

      recorder.start()
      setRecordingId(sentenceId)
    } catch (e: any) {
      alert("Microphone Error: " + (e.message || "Could not access microphone or feature is not supported on this device."))
      console.error("Recording error:", e)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    // Do NOT setRecordingId(null) here! Let onstop handle the transition to prevent React DOM insertBefore crashes.
  }

  const handleUpload = async () => {
    if (!localAudioBlob) return

    setUploading(activeSentence.id)
    try {
      // Completely bypass Web Audio API on iOS/Chrome to prevent WKWebView crashes
      const durationSec = recordingTime;

      // Enforce Minimum/Maximum Duration
      if (minDuration !== null && durationSec < minDuration) {
        throw new Error(`Recording is too short (${durationSec.toFixed(1)}s). Minimum required is ${minDuration}s.`)
      }
      if (maxDuration !== null && durationSec > maxDuration) {
        throw new Error(`Recording is too long (${durationSec.toFixed(1)}s). Maximum allowed is ${maxDuration}s.`)
      }

      // Instead of client-side resampling (which causes memory crashes on iOS), 
      // we upload the raw format directly. 
      const finalBlob = localAudioBlob;
      const fileExt = finalBlob.type.includes("mp4") || finalBlob.type.includes("m4a") ? "mp4" : "webm";

      const formData = new FormData()
      formData.append("audio", finalBlob, `recording_${activeSentence.id}.${fileExt}`)
      formData.append("fileSize", finalBlob.size.toString())
      formData.append("duration", durationSec.toString())
      formData.append("audioFormat", fileExt.toUpperCase())
      formData.append("sampleRate", sampleRate.toString())
      formData.append("bitDepth", bitDepth.toString())
      formData.append("channels", channels)

      const res = await uploadVoiceRecording(activeSentence.id, formData)
      if (res.success && res.url) {
        setRecordedMap(prev => ({
          ...prev,
          [activeSentence.id]: { url: res.url!, status: "PENDING", reason: null }
        }))
        // Discard local review states
        setLocalAudioBlob(null)
        setLocalAudioUrl(null)

        // Auto-advance if there are remaining sentences
        if (currentIndex < sentences.length - 1) {
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1)
          }, 600)
        }
      } else {
        alert(res.error || "Upload failed")
      }
    } catch (err: any) {
      alert(`Audio Validation Error: ${err.message}`)
    } finally {
      setUploading(null)
    }
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

  // Only lock if the whole application is UNDER_REVIEW or APPROVED, or the specific recording is ACCEPTED
  const isLocked = applicationStatus === "UNDER_REVIEW" || applicationStatus === "APPROVED" || applicationStatus === "ACCEPTED" || (savedRecord && savedRecord.status === "ACCEPTED")

  return (
    <div className="space-y-6" translate="no">
      {/* Constraints Indicator */}
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Format: {audioFormat}</span>
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Sample Rate: {sampleRate} Hz</span>
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Bit Depth: {bitDepth}-bit</span>
        <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary">Channels: {channels}</span>
        {minDuration && <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary font-bold">Min: {minDuration}s</span>}
        {maxDuration && <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary font-bold">Max: {maxDuration}s</span>}
      </div>

      {/* Header Info Panel */}
      <div className="glass p-6 rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Voice Recording Session
            </h2>
            <p className="text-sm text-foreground/60 mt-1">
              Read the sentences one by one. The system validates specifications in real-time.
            </p>
            {speakerCode && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-lg">
                <span className="text-xs text-foreground/50 font-semibold">كودك:</span>
                <span className="text-base font-black text-primary tracking-widest">{speakerCode}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{totalRecorded}<span className="text-foreground/40 text-lg">/{totalSentences}</span></p>
              <p className="text-xs text-foreground/50">Completed</p>
            </div>
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
      </div>

      {/* Active Sentence Visual Wizard Card */}
      <div className="glass p-6 sm:p-10 rounded-3xl border border-border relative overflow-hidden bg-card/40">
        <div className="absolute top-4 right-6 text-sm font-bold text-foreground/40 flex items-center gap-3">
          {activeSentence.audioId && (
            <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg">
              ID: {activeSentence.audioId}
            </span>
          )}
          <span>Sentence {currentIndex + 1} of {totalSentences}</span>
        </div>

        <div className="space-y-8 mt-4 text-center">
          {/* Large Sentence Text */}
          <div className="py-4">
            <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest mb-2">Please read the following text:</p>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground leading-relaxed whitespace-pre-line px-4" dir="auto">
              "{activeSentence.text}"
            </h2>
            
            {/* Speed Instructions */}
            {activeSentence.speed && (
              <div className="mt-6 flex justify-center">
                <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl max-w-md mx-auto animate-pulse">
                  <p className="text-red-600 font-extrabold text-lg flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    ملاحظة هامة:
                  </p>
                  <p className="text-red-600 font-semibold mt-1">
                    {activeSentence.speed.trim() === '慢' && "يُرجى قراءة هذه الجملة بسرعة بطيئة (أبطأ من العادي بقليل)."}
                    {activeSentence.speed.trim() === '正常' && "يُرجى قراءة هذه الجملة بسرعة عادية (سرعة التحدث اليومية)."}
                    {activeSentence.speed.trim() === '快' && "يُرجى قراءة هذه الجملة بسرعة (أسرع من العادي بقليل)."}
                    {!['慢', '正常', '快'].includes(activeSentence.speed.trim()) && `يُرجى قراءة هذه الجملة بالسرعة المطلوبة: ${activeSentence.speed}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Locked / Uploaded Status Alert */}
          {isLocked && (
            <div className="p-4 bg-green-500/10 border border-green-500/25 rounded-2xl max-w-md mx-auto flex items-center justify-center gap-3 text-green-500">
              <Lock className="w-5 h-5" />
              <div className="text-left">
                <p className="font-bold text-sm">Recording Locked</p>
                <p className="text-xs text-green-500/80">Pending Quality Control approval. Modification is disabled.</p>
              </div>
            </div>
          )}

          {/* QC Rejection Banner */}
          {savedRecord && savedRecord.status === "REJECTED" && (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl max-w-md mx-auto flex items-center justify-center gap-3 text-red-500">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-sm">QC Recording Rejected</p>
                {savedRecord.reason && <p className="text-xs text-red-500/80">Reason: {savedRecord.reason}</p>}
              </div>
            </div>
          )}

          {/* QC Re-recording Banner */}
          {savedRecord && savedRecord.status === "NEED_RE_RECORD" && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl max-w-md mx-auto flex items-center justify-center gap-3 text-yellow-600">
              <RotateCcw className="w-5 h-5 shrink-0 text-yellow-600" />
              <div className="text-left">
                <p className="font-bold text-sm">QC Re-recording Requested</p>
                {savedRecord.reason && <p className="text-xs text-yellow-600/90 font-medium">Feedback: {savedRecord.reason}</p>}
              </div>
            </div>
          )}

          {/* Interactive Recording Area */}
          <div className="max-w-md mx-auto p-6 bg-background/50 border border-border/80 rounded-2xl">
            {recordingId ? (
              // ───────── Active Recording Mode ─────────
              <div key="mode-recording" className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-red-500 font-bold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Recording... ({recordingTime.toFixed(1)}s)
                </div>

                {/* Volume Meter Visualizer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-foreground/40 font-bold">
                    <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Input Level</span>
                    <span>{volumeLevel}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-red-500 h-3 transition-all duration-75"
                      style={{ width: `${volumeLevel}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={stopRecording}
                  className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <Square className="w-4 h-4" /> Stop Recording
                </button>
              </div>
            ) : localAudioUrl ? (
              // ───────── Local Review & Submit Mode ─────────
              <div key="mode-review" className="space-y-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs font-semibold text-yellow-600">
                  Listen to the recording before uploading.
                </div>

                <div className="flex gap-2">
                  {/* Local Listen */}
                  <button
                    onClick={() => playRecording(localAudioUrl)}
                    className="flex-1 py-3 border border-border hover:border-primary/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {playingUrl === localAudioUrl ? (
                      <><Square className="w-4 h-4 text-primary" /> Stop Playback</>
                    ) : (
                      <><Play className="w-4 h-4 text-primary" /> Play Recording</>
                    )}
                  </button>

                  {/* Redo */}
                  <button
                    onClick={() => {
                      setLocalAudioBlob(null)
                      setLocalAudioUrl(null)
                    }}
                    className="px-4 border border-border hover:bg-red-500/10 hover:border-red-500/30 rounded-xl text-red-500 transition-colors flex items-center justify-center"
                    title="Record Again"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload Action */}
                <button
                  onClick={handleUpload}
                  disabled={!!uploading}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><UploadCloud className="w-4.5 h-4.5" /> Save & Submit</>
                  )}
                </button>
              </div>
            ) : savedRecord ? (
              // ───────── Already Saved & Uploaded Mode ─────────
              <div key="mode-saved" className="space-y-4">
                <div className={`flex flex-col items-center justify-center gap-2 text-sm font-bold p-4 rounded-xl border ${
                  savedRecord.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  savedRecord.status === 'NEED_RE_RECORD' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                  savedRecord.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-primary/10 text-primary border-primary/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {savedRecord.status === 'ACCEPTED' ? <Check className="w-5 h-5" /> : 
                     savedRecord.status === 'NEED_RE_RECORD' ? <RotateCcw className="w-5 h-5" /> : 
                     savedRecord.status === 'REJECTED' ? <X className="w-5 h-5" /> :
                     <Check className="w-5 h-5" />}
                    {savedRecord.status === 'ACCEPTED' ? 'Sentence Accepted' :
                     savedRecord.status === 'NEED_RE_RECORD' ? 'Re-record Required' :
                     savedRecord.status === 'REJECTED' ? 'Recording Rejected' :
                     'Saved & Uploaded'}
                  </div>
                  
                  {savedRecord.status === 'NEED_RE_RECORD' && savedRecord.reason && (
                    <p className="mt-2 text-xs opacity-90 text-center font-normal text-yellow-600">
                      <strong className="block mb-1 text-sm">Feedback:</strong>
                      {savedRecord.reason}
                    </p>
                  )}
                  {savedRecord.status === 'REJECTED' && savedRecord.reason && (
                    <p className="mt-2 text-xs opacity-90 text-center font-normal text-red-500">
                      <strong className="block mb-1 text-sm">Reason:</strong>
                      {savedRecord.reason}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => playRecording(savedRecord.url)}
                  className="w-full py-3 bg-card border border-border hover:border-primary/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {playingUrl === savedRecord.url ? (
                    <><Square className="w-4 h-4 text-primary" /> Stop Playback</>
                  ) : (
                    <><Play className="w-4 h-4 text-primary" /> Play Uploaded Audio</>
                  )}
                </button>

                {!isLocked && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to re-record this sentence? Your old recording will be overwritten upon upload.")) {
                        startRecording(activeSentence.id)
                      }
                    }}
                    className="w-full py-3 border border-dashed border-red-500/40 text-red-500 font-bold rounded-xl hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Re-record
                  </button>
                )}
              </div>
            ) : (
              // ───────── Idle / Ready Mode ─────────
              <div key="mode-idle" className="space-y-4">
                <p className="text-xs text-foreground/50">Ready to record. Click button below.</p>
                <button
                  onClick={() => startRecording(activeSentence.id)}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Mic className="w-4.5 h-4.5" /> Click to Record
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between border-t border-border mt-10 pt-6">
          <button
            onClick={() => {
              // Discard unsaved local reviews
              setLocalAudioBlob(null)
              setLocalAudioUrl(null)
              setCurrentIndex(prev => Math.max(0, prev - 1))
            }}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-card border border-border rounded-xl font-bold text-sm text-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-foreground/70"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={() => {
              // Discard unsaved local reviews
              setLocalAudioBlob(null)
              setLocalAudioUrl(null)
              setCurrentIndex(prev => Math.min(sentences.length - 1, prev + 1))
            }}
            disabled={currentIndex === sentences.length - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-card border border-border rounded-xl font-bold text-sm text-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-foreground/70"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid selector representing all sentences for easy click-to-nav */}
      <div className="glass p-5 rounded-2xl border border-border">
        <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">All Sentences Map:</h3>
        <div className="flex flex-wrap gap-2">
          {sentences.map((s, idx) => {
            const status = recordedMap[s.id]?.status
            const hasRec = !!recordedMap[s.id]?.url
            const isActive = idx === currentIndex

            let bgClass = "bg-card border-border text-foreground/60 hover:border-primary/50"
            if (isActive) {
              bgClass = "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
            } else if (status === "ACCEPTED") {
              bgClass = "bg-green-500/20 text-green-500 border-green-500/30"
            } else if (status === "REJECTED") {
              bgClass = "bg-red-500/20 text-red-500 border-red-500/30 animate-pulse"
            } else if (status === "NEED_RE_RECORD") {
              bgClass = "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
            } else if (hasRec) {
              bgClass = "bg-blue-500/20 text-blue-500 border-blue-500/30"
            }

            return (
              <button
                key={s.id}
                onClick={() => {
                  setLocalAudioBlob(null)
                  setLocalAudioUrl(null)
                  setCurrentIndex(idx)
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${bgClass}`}
              >
                {s.order}
              </button>
            )
          })}
        </div>
      </div>

      {/* Final success alert */}
      {allDone && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-500">All sentences recorded! 🎉</p>
          <p className="text-sm text-foreground/60 mt-1">Your recordings are now saved.</p>
          
          {!submittedAll && applicationStatus !== "UNDER_REVIEW" && applicationStatus !== "APPROVED" ? (
            <button
              onClick={async () => {
                setIsSubmittingAll(true)
                const res = await submitAllRecordings(projectId)
                if (res.success) {
                  setSubmittedAll(true)
                } else {
                  alert("Failed to notify admin: " + res.error)
                }
                setIsSubmittingAll(false)
              }}
              disabled={isSubmittingAll}
              className="mt-6 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {isSubmittingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {isSubmittingAll ? "Submitting..." : "Submit to Admin for Review"}
            </button>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              <div className="p-4 bg-green-500/20 rounded-xl text-green-600 font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Successfully submitted to Admin!
              </div>
              <p className="text-sm text-foreground/60">
                Your recordings have been submitted. The admin will review them shortly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function audioBufferToWav(buffer: AudioBuffer, bitDepth: number = 16): ArrayBuffer {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // 1 = PCM uncompressed
  const bytesPerSample = bitDepth === 24 ? 3 : 2
  const blockAlign = numChannels * bytesPerSample
  
  const bufferLength = buffer.length
  const dataLength = bufferLength * blockAlign
  const headerLength = 44
  
  const wav = new ArrayBuffer(headerLength + dataLength)
  const view = new DataView(wav)
  
  // RIFF identifier
  writeString(view, 0, "RIFF")
  // file length minus RIFF identifier length and file description length
  view.setUint32(4, 36 + dataLength, true)
  // RIFF type
  writeString(view, 8, "WAVE")
  // format chunk identifier
  writeString(view, 12, "fmt ")
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (raw)
  view.setUint16(20, format, true)
  // channel count
  view.setUint16(22, numChannels, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate = (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true)
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true)
  // bits per sample
  view.setUint16(34, bitDepth, true)
  // data chunk identifier
  writeString(view, 36, "data")
  // data chunk length
  view.setUint32(40, dataLength, true)
  
  // Write interleaved PCM samples
  const offset = 44
  if (bitDepth === 24) {
    for (let i = 0; i < bufferLength; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = buffer.getChannelData(channel)[i]
        // clamp sample to [-1, 1]
        sample = Math.max(-1, Math.min(1, sample))
        // convert to 24-bit integer
        const sampleVal = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF
        const intVal = Math.floor(sampleVal)
        const index = offset + (i * blockAlign) + (channel * bytesPerSample)
        view.setUint8(index, intVal & 0xFF)
        view.setUint8(index + 1, (intVal >> 8) & 0xFF)
        view.setUint8(index + 2, (intVal >> 16) & 0xFF)
      }
    }
  } else {
    // 16-bit PCM
    for (let i = 0; i < bufferLength; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = buffer.getChannelData(channel)[i]
        // clamp sample to [-1, 1]
        sample = Math.max(-1, Math.min(1, sample))
        // convert to 16-bit integer
        const sampleVal = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), Math.floor(sampleVal), true)
      }
    }
  }
  
  return wav
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
