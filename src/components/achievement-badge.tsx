"use client"

import * as React from "react"
import type { Badge, LevelInfo } from "@/lib/gamification"
import { ProgressBar } from "@/components/progress-bar"

// ── Single Badge chip ────────────────────────────────────────────────────────
export function AchievementBadge({ badge }: { badge: Badge }) {
  return (
    <div
      title={badge.description}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        badge.earned
          ? "border-transparent shadow-md hover:scale-105"
          : "border-border opacity-40 grayscale"
      }`}
      style={badge.earned ? { background: `${badge.color}20`, borderColor: `${badge.color}40` } : {}}
    >
      <span className="text-xl">{badge.emoji}</span>
      <div>
        <p className="text-xs font-bold" style={badge.earned ? { color: badge.color } : {}}>
          {badge.name}
        </p>
        <p className="text-[10px] text-foreground/50">{badge.description}</p>
      </div>
    </div>
  )
}

// ── Level card ───────────────────────────────────────────────────────────────
export function LevelCard({
  level,
  progress,
  completedCount,
  nextLevel,
}: {
  level: LevelInfo
  progress: number
  completedCount: number
  nextLevel: LevelInfo | null
}) {
  return (
    <div className={`p-5 rounded-2xl text-white shadow-xl relative overflow-hidden ${level.cssClass}`}>
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{level.emoji}</span>
          <div>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">مستواك الحالي</p>
            <h3 className="text-xl font-black">{level.label} <span className="text-sm opacity-70">({level.labelEn})</span></h3>
          </div>
        </div>

        <p className="text-sm opacity-80 mb-3">
          {completedCount} مهمة مكتملة
          {nextLevel && ` · يتبقى ${nextLevel.minCompleted - completedCount} للمستوى التالي`}
        </p>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] opacity-70 font-semibold">
              <span>{level.label}</span>
              <span>{nextLevel.emoji} {nextLevel.label}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full animate-progress"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!nextLevel && (
          <p className="text-sm font-bold opacity-90">🏆 وصلت للمستوى الأعلى!</p>
        )}
      </div>
    </div>
  )
}

// ── Badges grid ──────────────────────────────────────────────────────────────
export function BadgesGrid({ badges }: { badges: Badge[] }) {
  const earned  = badges.filter(b => b.earned)
  const locked  = badges.filter(b => !b.earned)

  return (
    <div className="space-y-4">
      {earned.length > 0 && (
        <>
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            الشارات المكتسبة ({earned.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earned.map(b => <AchievementBadge key={b.id} badge={b} />)}
          </div>
        </>
      )}
      {locked.length > 0 && (
        <>
          <p className="text-xs font-bold text-foreground/30 uppercase tracking-wider mt-4">
            قادماً ({locked.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locked.map(b => <AchievementBadge key={b.id} badge={b} />)}
          </div>
        </>
      )}
    </div>
  )
}
