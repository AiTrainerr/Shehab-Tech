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
  isValid?: boolean
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
  const [isLooping, setIsLooping] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const segmentRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

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
      
      // Load initial segments into regions
      wsRegions.clearRegions()
      initialSegments.forEach((seg) => {
        wsRegions.addRegion({
          id: seg.id,
          start: seg.startTime,
          end: seg.endTime,
          color: "rgba(37, 99, 235, 0.2)",
          drag: !isReviewMode,
          resize: !isReviewMode,
        })
      })
    })

    // Handle region creation by dragging
    wsRegions.enableDragSelection({
      color: "rgba(37, 99, 235, 0.2)",
    })

    wsRegions.on("region-clicked", (region: any, e: any) => {
      e.stopPropagation()
      setActiveSegmentId(region.id)
      
      // Auto-scroll to the active segment
      setTimeout(() => {
        const el = segmentRefs.current[region.id]
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })
        }
      }, 50)
    })

    ws.on("click", () => {
      setActiveSegmentId(null)
    })

    wsRegions.on("region-created", (region: any) => {
      setSegments((prev) => {
        if (prev.find((s) => s.id === region.id)) return prev
        
        // Prevent overlap on create
        const overlap = prev.find(s => region.start < s.endTime && region.end > s.startTime)
        if (overlap) {
          region.remove()
          return prev
        }

        const newSegment: Segment = {
          id: region.id,
          startTime: region.start,
          endTime: region.end,
          speakerLabel: `Speaker 1`,
          transcriptText: "",
          isValid: true,
        }
        setActiveSegmentId(region.id)
        setHasUnsavedChanges(true)
        return [...prev, newSegment].sort((a, b) => a.startTime - b.startTime)
      })
    })

    wsRegions.on("region-updated", (region: any) => {
      setSegments((prev) => {
        // Overlap Prevention
        const overlap = prev.find(s => s.id !== region.id && region.start < s.endTime && region.end > s.startTime)
        if (overlap) {
          // Revert to original
          const original = prev.find(s => s.id === region.id)
          if (original) {
            region.setOptions({ start: original.startTime, end: original.endTime })
            return prev
          }
        }

        setHasUnsavedChanges(true)
        return prev.map((s) =>
          s.id === region.id
            ? { ...s, startTime: region.start, endTime: region.end }
            : s
        ).sort((a, b) => a.startTime - b.startTime)
      })
    })

    wsRef.current = ws

    // Loop logic
    const onTimeUpdate = (currentTime: number) => {
      // Cannot use state values directly inside this closure unless we use a ref or re-bind.
      // But WaveSurfer timeupdate runs frequently. 
    }
    ws.on("timeupdate", onTimeUpdate)

    return () => {
      ws.un("timeupdate", onTimeUpdate)
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



  // Unsaved changes prompt
  React.useEffect(() => {
    if (!hasUnsavedChanges) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [hasUnsavedChanges])

  const handlePlayPause = () => {
    if (wsRef.current) {
      wsRef.current.playPause()
    }
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 20, 200))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 20, 10))

  const handlePlayActiveSegment = () => {
    if (!wsRef.current || !activeSegmentId) return
    const wsRegions = regionsRef.current
    if (wsRegions) {
      const regions = wsRegions.getRegions()
      const region = regions.find((r: any) => r.id === activeSegmentId)
      if (region) region.play()
    }
  }

  // Loop effect
  React.useEffect(() => {
    if (!wsRef.current) return
    const ws = wsRef.current

    const onTimeUpdate = (currentTime: number) => {
      if (!isLooping || !activeSegmentId) return
      const activeSeg = segments.find(s => s.id === activeSegmentId)
      if (activeSeg && currentTime >= activeSeg.endTime) {
        ws.play(activeSeg.startTime)
      }
    }

    ws.on("timeupdate", onTimeUpdate)
    return () => {
      ws.un("timeupdate", onTimeUpdate)
    }
  }, [isLooping, activeSegmentId, segments])

  const handleSegmentTextChange = (id: string, text: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, transcriptText: text } : s)))
    setHasUnsavedChanges(true)
  }

  const handleSegmentSpeakerChange = (id: string, speaker: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, speakerLabel: speaker } : s)))
    setHasUnsavedChanges(true)
  }

  const handleSegmentValidToggle = (id: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, isValid: s.isValid === false ? true : false } : s)))
    setHasUnsavedChanges(true)
  }

  const handleDeleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id))
    setHasUnsavedChanges(true)
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
      setHasUnsavedChanges(false)
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-3">
            <span>Segments</span>
            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">{segments.length} segments</span>
          </h3>
          <div className="text-sm font-bold bg-card border border-border px-4 py-2 rounded-xl">
            Valid Duration: <span className="text-green-500">{formatTime(segments.filter(s => s.isValid !== false).reduce((acc, s) => acc + (s.endTime - s.startTime), 0))}</span>
          </div>
        </div>

        {segments.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl text-foreground/50">
            No segments yet. Select a region on the waveform to add a segment.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {[...segments].sort((a, b) => {
            if (a.id === activeSegmentId) return -1;
            if (b.id === activeSegmentId) return 1;
            return a.startTime - b.startTime;
          }).map((seg, idx) => {
            const isActive = activeSegmentId === null || activeSegmentId === seg.id;
            const effectiveSpeakerCount = Math.max(speakerCount || 1, 8); // Ensure at least 8 speakers

            return (
            <div 
              key={seg.id} 
              ref={(el) => { segmentRefs.current[seg.id] = el }}
              className={`glass p-4 rounded-xl border flex flex-col md:flex-row gap-4 animate-slide-up transition-all ${isActive ? 'border-primary ring-1 ring-primary shadow-lg' : 'border-border opacity-70 hover:opacity-100'}`} style={{ animationDelay: `${idx * 50}ms` }} onClick={() => setActiveSegmentId(seg.id)}>
              {/* Timing & Speaker Info */}
              <div className="md:w-48 shrink-0 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono bg-background/50 px-2 py-1 rounded-md border border-border">
                  <span className="text-primary">{formatTime(seg.startTime)}</span>
                  <span className="text-foreground/40">→</span>
                  <span className="text-primary">{formatTime(seg.endTime)}</span>
                </div>

                {isActive && (
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePlayActiveSegment(); }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 py-1.5 rounded-md transition-colors"
                    >
                      <Play className="w-3 h-3" /> Play
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsLooping(!isLooping); }}
                      className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md transition-colors ${isLooping ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-background/50 border border-border hover:bg-border'}`}
                    >
                      Loop {isLooping ? "ON" : "OFF"}
                    </button>
                  </div>
                )}
                
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

                    <label className="flex items-center gap-2 text-sm bg-background/50 border border-border px-2 py-1.5 rounded-md cursor-pointer hover:bg-background/80 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={seg.isValid !== false} 
                        onChange={(e) => { e.stopPropagation(); handleSegmentValidToggle(seg.id); }}
                        disabled={isReviewMode}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      Valid Segment
                    </label>

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
                  <div className="text-sm text-foreground/70 line-clamp-2 bg-background/30 p-3 rounded-xl border border-border cursor-pointer flex justify-between items-start gap-4">
                    <span>{seg.transcriptText || <span className="italic opacity-50">Empty segment...</span>}</span>
                    {seg.isValid === false && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-md shrink-0">Invalid</span>}
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
