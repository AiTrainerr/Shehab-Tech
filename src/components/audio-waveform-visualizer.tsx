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
  onVolumeChange?: (vol: number) => void
}

export function AudioWaveformVisualizer({
  isRecording = false,
  isPlaying = false,
  stream = null,
  barCount = 36,
  recordingTime = 0,
  activeColor = "bg-red-500 dark:bg-red-500",
  inactiveColor = "bg-primary dark:bg-primary",
  onVolumeChange
}: AudioWaveformVisualizerProps) {
  const barRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const volumeBarRef = React.useRef<HTMLDivElement | null>(null)
  const volumeStatusRef = React.useRef<HTMLSpanElement | null>(null)
  const volumeLevelNumRef = React.useRef<HTMLSpanElement | null>(null)

  const animationFrameRef = React.useRef<number | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const silentGainRef = React.useRef<GainNode | null>(null)

  // Baseline symmetric envelope calculation
  const getBaselineHeights = React.useCallback((count: number) => {
    const heights: number[] = []
    const center = (count - 1) / 2
    for (let i = 0; i < count; i++) {
      const distFromCenter = Math.abs(i - center) / center
      // Symmetrical smooth bell curve
      const envelope = Math.max(0.12, Math.exp(-Math.pow(distFromCenter * 1.8, 2)))
      const baseH = envelope * 45 + 10 // between 15% and 55%
      heights.push(Math.round(baseH))
    }
    return heights
  }, [])

  // Setup Web Audio API Analyzer when stream is available & recording
  React.useEffect(() => {
    if (!isRecording || !stream) {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch(() => {})
        } catch (e) {}
        audioContextRef.current = null
        sourceRef.current = null
        analyserRef.current = null
        silentGainRef.current = null
      }
      return
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const audioCtx = new AudioCtx()
      audioContextRef.current = audioCtx

      // Crucial: AudioContext must be resumed if suspended
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {})
      }

      // Keep source in ref to prevent WebKit garbage collection
      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.3 // Snappy, responsive to speech
      analyser.minDecibels = -85
      analyser.maxDecibels = -15
      analyserRef.current = analyser

      // Route through a silent gain node into destination
      // This forces the WebKit / Chromium audio pipeline to continuously pump buffers
      const silentGain = audioCtx.createGain()
      silentGain.gain.value = 0
      silentGainRef.current = silentGain

      source.connect(analyser)
      analyser.connect(silentGain)
      silentGain.connect(audioCtx.destination)
    } catch (err) {
      console.warn("AudioContext setup error:", err)
      analyserRef.current = null
    }

    return () => {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch(() => {})
        } catch (e) {}
        audioContextRef.current = null
        sourceRef.current = null
        analyserRef.current = null
        silentGainRef.current = null
      }
    }
  }, [isRecording, stream])

  // Animation Loop: Real-time dynamic waveform reacting to microphone volume & frequencies
  React.useEffect(() => {
    let phase = 0
    let smoothedVolume = 0

    const update = () => {
      phase += 0.12
      const center = (barCount - 1) / 2

      if (isRecording && analyserRef.current) {
        const analyser = analyserRef.current
        const bufferLength = analyser.frequencyBinCount // 128
        const timeData = new Uint8Array(analyser.fftSize) // 256
        const freqData = new Uint8Array(bufferLength) // 128

        analyser.getByteTimeDomainData(timeData)
        analyser.getByteFrequencyData(freqData)

        // 1. Calculate TRUE instantaneous RMS volume from time domain
        let sumSquares = 0
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128
          sumSquares += norm * norm
        }
        const rms = Math.sqrt(sumSquares / timeData.length) // 0 to ~0.5 for speech

        // Boost sensitivity for microphones
        const rawVol = Math.min(1, Math.max(0, rms * 4.2))

        // Fast attack, smooth decay
        if (rawVol > smoothedVolume) {
          smoothedVolume = rawVol
        } else {
          smoothedVolume = smoothedVolume * 0.85 + rawVol * 0.15
        }

        const volPercent = Math.round(smoothedVolume * 100)

        // Update Volume Meter UI directly (zero React re-render overhead)
        if (volumeBarRef.current) {
          volumeBarRef.current.style.width = `${Math.min(100, Math.max(4, volPercent))}%`
          if (volPercent > 80) {
            volumeBarRef.current.className = "h-full rounded-full transition-all duration-75 bg-red-500 shadow-sm shadow-red-500/50"
          } else if (volPercent > 60) {
            volumeBarRef.current.className = "h-full rounded-full transition-all duration-75 bg-amber-500 shadow-sm shadow-amber-500/50"
          } else if (volPercent > 8) {
            volumeBarRef.current.className = "h-full rounded-full transition-all duration-75 bg-emerald-500 shadow-sm shadow-emerald-500/50"
          } else {
            volumeBarRef.current.className = "h-full rounded-full transition-all duration-75 bg-foreground/20"
          }
        }

        if (volumeLevelNumRef.current) {
          volumeLevelNumRef.current.innerText = `${volPercent}%`
        }

        if (volumeStatusRef.current) {
          if (volPercent > 80) {
            volumeStatusRef.current.innerText = "صوت قوي جداً (Loud)"
            volumeStatusRef.current.className = "text-[10px] font-bold text-red-500"
          } else if (volPercent > 12) {
            volumeStatusRef.current.innerText = "مستوى الصوت ممتاز (Good Voice)"
            volumeStatusRef.current.className = "text-[10px] font-bold text-emerald-500"
          } else {
            volumeStatusRef.current.innerText = "في انتظار الكلام (Silent / Speak)"
            volumeStatusRef.current.className = "text-[10px] font-bold text-foreground/40"
          }
        }

        if (onVolumeChange) {
          onVolumeChange(volPercent)
        }

        // 2. Compute dynamic bar heights
        // Vocal energy is concentrated in bins 1 to 24 (~100Hz - 4500Hz)
        const isSpeaking = smoothedVolume > 0.03

        for (let i = 0; i < barCount; i++) {
          const el = barRefs.current[i]
          if (!el) continue

          const distFromCenter = Math.abs(i - center) / center
          // Symmetric Gaussian envelope: center bars are tallest
          const envelope = Math.max(0.18, Math.exp(-Math.pow(distFromCenter * 1.6, 2)))

          if (isSpeaking) {
            // Map distance to vocal frequency bins (center = lower vowels, sides = upper consonants)
            const binIdx = Math.min(
              bufferLength - 1,
              Math.max(1, Math.floor(1 + (1 - distFromCenter) * 22))
            )
            const freqAmp = (freqData[binIdx] || 0) / 255 // 0 to 1

            // Combined speech power: real frequency amplitude + RMS volume
            const speechEnergy = Math.max(freqAmp * 0.75 + smoothedVolume * 0.25, smoothedVolume * 0.6)

            // Dynamic height: scaled directly with real audio level
            // Center bars can reach 96% when speaking loudly
            const dynamicHeight = 8 + speechEnergy * envelope * 88
            const finalHeight = Math.min(100, Math.max(8, dynamicHeight))

            el.style.height = `${finalHeight}%`
            el.style.opacity = `${0.65 + speechEnergy * 0.35}`
          } else {
            // Quiet / Silent resting baseline: small resting wave (7% - 12%)
            const idleBreath = Math.sin(phase * 0.8 + i * 0.3) * 2
            const restH = 7 + envelope * 5 + idleBreath
            el.style.height = `${Math.max(6, restH)}%`
            el.style.opacity = "0.45"
          }
        }
      } else if (isPlaying) {
        // Playback rhythmic wave animation
        for (let i = 0; i < barCount; i++) {
          const el = barRefs.current[i]
          if (!el) continue

          const distFromCenter = Math.abs(i - center) / center
          const envelope = Math.max(0.2, Math.exp(-Math.pow(distFromCenter * 1.5, 2)))

          const wave1 = Math.sin(phase * 1.5 + i * 0.5)
          const wave2 = Math.cos(phase * 0.9 + i * 0.3)
          const wave3 = Math.sin(phase * 2.2 - i * 0.7)
          const combined = (wave1 + wave2 + wave3) / 3

          const dynamicH = (0.2 + envelope * (0.45 + combined * 0.35)) * 100
          el.style.height = `${Math.min(95, Math.max(12, dynamicH))}%`
          el.style.opacity = "0.85"
        }

        if (volumeStatusRef.current) {
          volumeStatusRef.current.innerText = "تشغيل التسجيل (Playback)"
          volumeStatusRef.current.className = "text-[10px] font-bold text-primary"
        }
      } else {
        // Idle baseline envelope
        const baseline = getBaselineHeights(barCount)
        for (let i = 0; i < barCount; i++) {
          const el = barRefs.current[i]
          if (el) {
            el.style.height = `${baseline[i] || 15}%`
            el.style.opacity = "0.4"
          }
        }
        if (volumeBarRef.current) {
          volumeBarRef.current.style.width = "0%"
        }
        if (volumeLevelNumRef.current) {
          volumeLevelNumRef.current.innerText = "0%"
        }
        if (volumeStatusRef.current) {
          volumeStatusRef.current.innerText = "جاهز للتسجيل (Ready)"
          volumeStatusRef.current.className = "text-[10px] font-bold text-foreground/40"
        }
      }

      animationFrameRef.current = requestAnimationFrame(update)
    }

    animationFrameRef.current = requestAnimationFrame(update)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isRecording, isPlaying, barCount, getBaselineHeights, onVolumeChange])

  const initialHeights = React.useMemo(() => getBaselineHeights(barCount), [barCount, getBaselineHeights])
  const barColor = isRecording ? activeColor : isPlaying ? inactiveColor : "bg-foreground/25 dark:bg-foreground/20"

  return (
    <div className="w-full py-4 px-3 sm:px-6 bg-card/70 dark:bg-black/40 border border-border/80 rounded-2xl flex flex-col items-center justify-center gap-3 select-none shadow-sm">
      {/* Waveform Bar Container */}
      <div className="h-20 sm:h-24 w-full flex items-center justify-center gap-1 sm:gap-1.5 overflow-hidden px-2">
        {initialHeights.map((initialH, idx) => (
          <div
            key={idx}
            ref={(el) => {
              barRefs.current[idx] = el
            }}
            className={`w-1 sm:w-1.5 rounded-full transition-[height] duration-75 ease-out ${barColor}`}
            style={{
              height: `${initialH}%`,
              minHeight: "6px",
              maxHeight: "100%",
              opacity: isRecording ? 0.95 : isPlaying ? 0.85 : 0.4
            }}
          />
        ))}
      </div>

      {/* Live Volume Meter Bar (shows when recording) */}
      {isRecording && (
        <div className="w-full px-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-foreground/60 mb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              مستوى الصوت (Voice Level):
            </span>
            <span ref={volumeLevelNumRef} className="font-mono text-primary font-bold">
              0%
            </span>
          </div>
          <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div
              ref={volumeBarRef}
              className="h-full rounded-full transition-all duration-75 bg-foreground/20"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      )}

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
          <span className="uppercase tracking-wider font-semibold">
            {isRecording
              ? `Recording... ${recordingTime.toFixed(1)}s`
              : isPlaying
              ? "Playing Recording..."
              : "Audio Waveform"}
          </span>
        </div>
        <span ref={volumeStatusRef} className="text-[10px] font-bold text-foreground/40">
          جاهز للتسجيل (Ready)
        </span>
      </div>
    </div>
  )
}
