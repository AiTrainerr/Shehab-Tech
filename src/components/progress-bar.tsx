"use client"

import * as React from "react"

interface ProgressBarProps {
  value: number          // 0-100
  max?: number
  label?: string
  showPercent?: boolean
  color?: "primary" | "green" | "yellow" | "red" | "purple"
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

const colorMap = {
  primary: "bg-primary",
  green:   "bg-green-500",
  yellow:  "bg-yellow-500",
  red:     "bg-red-500",
  purple:  "bg-purple-500",
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  color = "primary",
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  const barColor = colorMap[color]
  const barSize  = sizeMap[size]

  return (
    <div className="w-full space-y-1">
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-foreground/70">{label}</span>}
          {showPercent && <span className="text-foreground/50">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${barSize} bg-border rounded-full overflow-hidden`}>
        <div
          className={`${barColor} ${barSize} rounded-full transition-all duration-1000 ease-out ${animated ? "animate-progress" : ""}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
