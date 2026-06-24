"use client"

import * as React from "react"
import WaveSurfer from "wavesurfer.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js"
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js"
import { Play, Pause, ZoomIn, ZoomOut, Save, Plus, Trash2, Check, X } from "lucide-react"

export interface Segment {
  id: string
  startTime: number
  endTime: number
  speakerLabel: string
  transcriptText: string
}

interface TranscriptionEditorProps {
  taskId: string
  audioUrl: string
  initialSegments: Segment[]
  speakerCount: number
  isReviewMode?: boolean
  isQC?: boolean
  onSave?: (segments: Segment[]) => Promise<void>
  onSubmit?: () => Promise<void>
  onApprove?: () => Promise<void>
  onReject?: (notes: string) => Promise<void>
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
}

export function TranscriptionEditor({
  taskId,
  audioUrl,
  initialSegments,
  speakerCount,
  isReviewMode = false,
  isQC = false,
  onSave,
  onSubmit,
  onApprove,
  onReject,
}: TranscriptionEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const timelineRef = React.useRef<HTMLDivElement>(null)
  const wsRef = React.useRef<WaveSurfer | null>(null)
  const regionsRef = React.useRef<any>(null)

  const [isPlaying, setIsPlaying] = React.useState(false)
  const [zoom, setZoom] = React.useState(50)
  const [segments, setSegments] = React.useState<Segment[]>(initialSegments)
  const [isSaving, setIsSaving] = React.useState(false)
  const [rejectNotes, setRejectNotes] = React.useState("")
  const [showRejectBox, setShowRejectBox] = React.useState(false)
  const [isReady, setIsReady] = React.useState(false)
  const [activeSegmentId, setActiveSegmentId] = React.useState<string | null>(null)

  // Initialize WaveSurfer
  React.useEffect(() => {
    if (!containerRef.current || !timelineRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(37, 99, 235, 0.4)", // primary/40
      progressColor: "rgba(37, 99, 235, 0.8)", // primary/80
      cursorColor: "#ef4444",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 100,
      minPxPerSec: zoom,
      plugins: [
        TimelinePlugin.create({ container: timelineRef.current }),
      ],
    })

    const wsRegions = ws.registerPlugin(RegionsPlugin.create())
    regionsRef.current = wsRegions

    ws.load(audioUrl)

    ws.on("play", () => setIsPlaying(true))
    ws.on("pause", () => setIsPlaying(false))
    ws.on("ready", () => {
      setIsReady(true)
      ws.zoom(zoom) // apply initial zoom
    })

    // Handle region creation by dragging
    wsRegions.enableDragSelection({
      color: "rgba(37, 99, 235, 0.2)",
    })

    wsRegions.on("region-clicked", (region: any, e: any) => {
      e.stopPropagation()
      setActiveSegmentId(region.id)
      region.play()
    })

    ws.on("click", () => {
      setActiveSegmentId(null)
    })

    wsRegions.on("region-created", (region: any) => {
      // Check if it already exists in our state (to prevent duplicates during initial load)
      setSegments((prev) => {
        if (prev.find((s) => s.id === region.id)) return prev
        const newSegment: Segment = {
          id: region.id,
          startTime: region.start,
          endTime: region.end,
          speakerLabel: `Speaker 1`,
          transcriptText: "",
        }
        setActiveSegmentId(region.id)
        return [...prev, newSegment].sort((a, b) => a.startTime - b.startTime)
      })
    })

    wsRegions.on("region-updated", (region: any) => {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === region.id
            ? { ...s, startTime: region.start, endTime: region.end }
            : s
        ).sort((a, b) => a.startTime - b.startTime)
      )
    })

    wsRef.current = ws

    return () => {
      ws.destroy()
    }
  }, [audioUrl])

  // Sync zoom
  React.useEffect(() => {
    if (wsRef.current && isReady) {
      try {
        wsRef.current.zoom(zoom)
      } catch (e) {
        console.warn("Zoom error:", e)
      }
    }
  }, [zoom, isReady])

  // Load initial segments into regions
  React.useEffect(() => {
    if (!regionsRef.current) return
    const wsRegions = regionsRef.current
    wsRegions.clearRegions()
    
    segments.forEach((seg) => {
      wsRegions.addRegion({
        id: seg.id,
        start: seg.startTime,
        end: seg.endTime,
        color: "rgba(37, 99, 235, 0.2)",
        drag: !isReviewMode,
        resize: !isReviewMode,
      })
    })
  }, [isReviewMode]) // Run when isReviewMode changes or once at start. We don't want to re-render regions on every text change.

  const handlePlayPause = () => {
    if (wsRef.current) {
      wsRef.current.playPause()
    }
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 20, 200))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 20, 10))

  const handleSegmentTextChange = (id: string, text: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, transcriptText: text } : s)))
  }

  const handleSegmentSpeakerChange = (id: string, speaker: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, speakerLabel: speaker } : s)))
  }

  const handleDeleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id))
    if (regionsRef.current) {
      const regions = regionsRef.current.getRegions()
      const region = regions.find((r: any) => r.id === id)
      if (region) region.remove()
    }
  }

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(segments)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Waveform Section */}
      <div className="glass p-4 rounded-2xl border border-border">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={handleZoomOut} className="p-2 hover:bg-border rounded-lg transition-colors">
              <ZoomOut className="w-5 h-5" />
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-border rounded-lg transition-colors">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {!isReviewMode && onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
            {!isReviewMode && onSubmit && (
              <button
                onClick={onSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold text-sm"
              >
                <Check className="w-4 h-4" />
                {isQC ? "Submit to Admin QA" : "Submit Task"}
              </button>
            )}
            {!isReviewMode && (
              <span className="text-xs text-foreground/50 hidden sm:inline">Drag to create a new segment</span>
            )}
          </div>
        </div>

        {/* Timeline & Waveform */}
        <div ref={timelineRef} className="mb-1 opacity-70 text-xs" />
        <div ref={containerRef} className="w-full relative z-10" />
      </div>

      {/* Segments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center justify-between">
          <span>Segments</span>
          <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">{segments.length} segments</span>
        </h3>

        {segments.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl text-foreground/50">
            No segments yet. Select a region on the waveform to add a segment.
          </div>
        )}

        <div className="grid gap-4">
          {segments.map((seg, idx) => {
            const isActive = activeSegmentId === null || activeSegmentId === seg.id;
            const effectiveSpeakerCount = Math.max(speakerCount || 1, 8); // Ensure at least 8 speakers

            return (
            <div key={seg.id} className={`glass p-4 rounded-xl border flex flex-col md:flex-row gap-4 animate-slide-up transition-all ${isActive ? 'border-primary ring-1 ring-primary shadow-lg' : 'border-border opacity-70 hover:opacity-100'}`} style={{ animationDelay: `${idx * 50}ms` }} onClick={() => setActiveSegmentId(seg.id)}>
              {/* Timing & Speaker Info */}
              <div className="md:w-48 shrink-0 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono bg-background/50 px-2 py-1 rounded-md border border-border">
                  <span className="text-primary">{formatTime(seg.startTime)}</span>
                  <span className="text-foreground/40">→</span>
                  <span className="text-primary">{formatTime(seg.endTime)}</span>
                </div>
                
                {isActive && (
                  <>
                    <select
                      value={seg.speakerLabel}
                      onChange={(e) => handleSegmentSpeakerChange(seg.id, e.target.value)}
                      disabled={isReviewMode}
                      className="w-full text-sm bg-background/50 border border-border rounded-md px-2 py-1.5 outline-none focus:border-primary transition-colors disabled:opacity-70"
                    >
                      {Array.from({ length: effectiveSpeakerCount }).map((_, i) => (
                        <option key={i} value={`Speaker ${i + 1}`}>
                          Speaker {i + 1}
                        </option>
                      ))}
                    </select>

                    {!isReviewMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSegment(seg.id); }}
                        className="w-full flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-500/10 py-1.5 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </>
                )}
                {!isActive && (
                  <div className="text-xs font-bold text-foreground/70">{seg.speakerLabel}</div>
                )}
              </div>

              {/* Text Area */}
              <div className="flex-1">
                {isActive ? (
                  <textarea
                    value={seg.transcriptText}
                    onChange={(e) => handleSegmentTextChange(seg.id, e.target.value)}
                    placeholder="Type transcription here..."
                    disabled={isReviewMode}
                    className="w-full h-full min-h-[80px] bg-background/50 border border-border rounded-xl p-3 text-sm outline-none focus:border-primary transition-colors resize-y disabled:opacity-90"
                    dir="auto"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-foreground/70 line-clamp-2 bg-background/30 p-3 rounded-xl border border-border cursor-pointer">
                    {seg.transcriptText || <span className="italic opacity-50">Empty segment...</span>}
                  </div>
                )}
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {/* Review Controls (Admin/QA Mode) */}
      {isReviewMode && (
        <div className="glass p-6 rounded-2xl border border-border mt-8">
          <h3 className="text-lg font-bold mb-4">QA Decision</h3>
          
          {showRejectBox ? (
            <div className="space-y-4 animate-fade-in">
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Write rejection notes for the transcriber to fix..."
                className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-red-500 transition-colors"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => onReject && onReject(rejectNotes)}
                  disabled={!rejectNotes.trim()}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowRejectBox(false)}
                  className="px-6 py-3 border border-border font-semibold rounded-xl hover:bg-card transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => onApprove && onApprove()}
                className="flex-1 py-4 bg-green-500 text-white font-bold text-lg rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                <Check className="w-6 h-6" /> Approve Transcription
              </button>
              <button
                onClick={() => setShowRejectBox(true)}
                className="flex-1 py-4 bg-red-500/10 text-red-500 font-bold text-lg rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-6 h-6" /> Request Edits
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
