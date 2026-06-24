"use client"

import * as React from "react"

// ── Generic skeleton block ──────────────────────────────────────────────────
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

// ── Project card skeleton ───────────────────────────────────────────────────
export function ProjectCardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl border border-border animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex gap-3 items-center">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <div className="flex gap-2 mt-2">
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <SkeletonBlock className="h-6 w-24 rounded-full" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3 md:min-w-[160px] md:items-end">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Stat card skeleton ──────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl border border-border animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <SkeletonBlock className="w-12 h-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-16" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-32" />
    </div>
  )
}

// ── Table row skeleton ──────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-border animate-fade-in">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// ── Notification skeleton ───────────────────────────────────────────────────
export function NotificationSkeleton() {
  return (
    <div className="flex gap-4 animate-fade-in">
      <SkeletonBlock className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" />
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-24" />
      </div>
    </div>
  )
}
