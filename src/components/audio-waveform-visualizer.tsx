"use client"

import * as React from "react"

interface AudioWaveformVisualizerProps {
  isRecording?: boolean
  isPlaying?: boolean
  stream?: MediaStream | null
  barCount?: number
  recordingTime?: number
  activeColor?: string
  inactiveColor?: string
}

export function AudioWaveformVisualizer({
  isRecording = false,
  isPlaying = false,
  stream = null,
  barCount = 32,
  recordingTime = 0,
  activeColor = "bg-red-500 dark:bg-red-500",
  inactiveColor = "bg-primary/70 dark:bg-primary/70"
}: AudioWaveformVisualizerProps) {
  const [barHeights, setBarHeights] = React.useState<number[]>([])
  const animationFrameRef = React.useRef<number | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)

  // Generate baseline envelope (bell curve waveform shape matching user's image)
  const getBaselineEnvelope = React.useCallback((count: number) => {
    const heights: number[] = []
    const center = (count - 1) / 2
    for (let i = 0; i < count; i++) {
      // Gaussian-like curve for aesthetic shape
      const distFromCenter = Math.abs(i - center) / center
      const envelope = Math.max(0.18, Math.exp(-Math.pow(distFromCenter * 1.8, 2)))
      
      // Secondary wave modulation to create realistic waveform peaks and valleys
      const wavePattern = 0.5 + 0.5 * Math.sin((i / count) * Math.PI * 4)
      const baseHeight = (0.2 + 0.8 * envelope * wavePattern) * 100
      heights.push(Math.max(15, Math.min(95, baseHeight)))
    }
    return heights
  }, [])

  // Initialize baseline
  React.useEffect(() => {
    setBarHeights(getBaselineEnvelope(barCount))
  }, [barCount, getBaselineEnvelope])

  // Setup Web Audio API analysis if stream is available
  React.useEffect(() => {
    if (!isRecording || !stream) {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // Ignore close errors
        }
        audioContextRef.current = null;
        analyserRef.current = null;
      }
      return
    }

    let isSubscribed = true
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        const audioCtx = new AudioCtx()
        audioContextRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.75
        source.connect(analyser)
        analyserRef.current = analyser
      }
    } catch (err) {
      console.warn("AudioContext setup for visualizer fallback to procedural animation:", err)
      audioContextRef.current = null
      analyserRef.current = null
    }

    return () => {
      isSubscribed = false
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {}
        audioContextRef.current = null
        analyserRef.current = null
      }
    }
  }, [isRecording, stream])

  // Animation Loop
  React.useEffect(() => {
    if (!isRecording && !isPlaying) {
      setBarHeights(getBaselineEnvelope(barCount))
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    let phase = 0

    const updateWave = () => {
      phase += 0.15
      const center = (barCount - 1) / 2
      const newHeights: number[] = []

      if (isRecording && analyserRef.current) {
        // Real-time audio frequency analysis
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength)
          const rawVal = dataArray[dataIndex] || 0
          const amplitude = rawVal / 255 // 0 to 1

          // Apply Gaussian envelope to shape into symmetric waveform
          const distFromCenter = Math.abs(i - center) / center
          const envelope = Math.max(0.15, Math.exp(-Math.pow(distFromCenter * 1.5, 2)))

          // Blend real audio amplitude with baseline shape
          const calculatedHeight = (0.15 + amplitude * envelope * 0.85) * 100
          newHeights.push(Math.max(12, Math.min(100, calculatedHeight)))
        }
      } else {
        // Dynamic procedural animation (fallback or playback animation)
        for (let i = 0; i < barCount; i++) {
          const distFromCenter = Math.abs(i - center) / center
          const envelope = Math.max(0.2, Math.exp(-Math.pow(distFromCenter * 1.6, 2)))
          
          // Organic multi-frequency wave formula
          const wave1 = Math.sin(phase + i * 0.4)
          const wave2 = Math.cos(phase * 0.7 + i * 0.2)
          const wave3 = Math.sin(phase * 1.3 - i * 0.5)
          const combinedWave = (wave1 + wave2 + wave3) / 3 // -1 to 1

          // Scale factor (higher movement when recording/playing)
          const activityFactor = isRecording ? 0.45 : 0.35
          const dynamicHeight = (0.25 + envelope * (0.5 + combinedWave * activityFactor)) * 100

          newHeights.push(Math.max(15, Math.min(95, dynamicHeight)))
        }
      }

      setBarHeights(newHeights)
      animationFrameRef.current = requestAnimationFrame(updateWave)
    }

    updateWave()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isRecording, isPlaying, barCount, getBaselineEnvelope])

  const barColor = isRecording ? activeColor : isPlaying ? inactiveColor : "bg-foreground/25 dark:bg-foreground/20"

  return (
    <div className="w-full py-4 px-3 sm:px-6 bg-card/60 dark:bg-black/30 border border-border/80 rounded-2xl flex flex-col items-center justify-center gap-2 select-none">
      {/* Waveform Bar Container */}
      <div className="h-20 sm:h-24 w-full flex items-center justify-center gap-1 sm:gap-1.5 overflow-hidden px-2">
        {barHeights.map((height, idx) => (
          <div
            key={idx}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ease-out ${barColor}`}
            style={{
              height: `${height}%`,
              minHeight: "8px",
              maxHeight: "100%",
              opacity: isRecording ? 0.95 : isPlaying ? 0.85 : 0.5
            }}
          />
        ))}
      </div>

      {/* Label / Status Footer */}
      <div className="flex items-center justify-between w-full text-[11px] font-bold text-foreground/50 px-1 pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isRecording
                ? "bg-red-500 animate-ping"
                : isPlaying
                ? "bg-primary animate-pulse"
                : "bg-foreground/30"
            }`}
          />
          <span className="uppercase tracking-wider">
            {isRecording
              ? `Recording... ${recordingTime.toFixed(1)}s`
              : isPlaying
              ? "Playing Recording..."
              : "Audio Waveform"}
          </span>
        </div>
        <span>{barCount} Bins</span>
      </div>
    </div>
  )
}
