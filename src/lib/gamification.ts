/**
 * gamification.ts
 * Centralised logic for user levels, badges, and progress.
 */

export type UserLevel = "مبتدئ" | "محترف" | "خبير" | "نجم"
export type LevelClass = "level-beginner" | "level-pro" | "level-expert" | "level-star"

export interface LevelInfo {
  label: UserLevel
  labelEn: string
  emoji: string
  cssClass: LevelClass
  minCompleted: number
  maxCompleted: number | null
  color: string
}

export const LEVELS: LevelInfo[] = [
  { label: "Beginner", labelEn: "Beginner", emoji: "🌱", cssClass: "level-beginner", minCompleted: 0,   maxCompleted: 4,    color: "#8b5cf6" },
  { label: "Pro",      labelEn: "Pro",      emoji: "⚡", cssClass: "level-pro",      minCompleted: 5,   maxCompleted: 14,   color: "#3b82f6" },
  { label: "Expert",   labelEn: "Expert",   emoji: "🔥", cssClass: "level-expert",   minCompleted: 15,  maxCompleted: 29,   color: "#ef4444" },
  { label: "Star",     labelEn: "Star",     emoji: "⭐", cssClass: "level-star",     minCompleted: 30,  maxCompleted: null, color: "#f59e0b" },
]

export function getUserLevel(completedCount: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (completedCount >= LEVELS[i].minCompleted) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getLevelProgress(completedCount: number): number {
  const level = getUserLevel(completedCount)
  if (!level.maxCompleted) return 100
  const range = level.maxCompleted - level.minCompleted + 1
  const done  = completedCount - level.minCompleted
  return Math.min(100, Math.round((done / range) * 100))
}

export function getNextLevel(completedCount: number): LevelInfo | null {
  const current = getUserLevel(completedCount)
  const idx = LEVELS.indexOf(current)
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
}

// ── Badge definitions ────────────────────────────────────────────────────────
export interface Badge {
  id: string
  name: string
  nameEn: string
  emoji: string
  description: string
  earned: boolean
  color: string
}

export function getUserBadges(user: {
  completedCount: number
  rating: number
  verificationStatus: string
}): Badge[] {
  const { completedCount, rating, verificationStatus } = user

  return [
    {
      id: "first_task",
      name: "First Task",
      nameEn: "First Task",
      emoji: "🎯",
      description: "Complete your first task",
      earned: completedCount >= 1,
      color: "#6366f1",
    },
    {
      id: "five_tasks",
      name: "Rising Pro",
      nameEn: "Rising Pro",
      emoji: "⚡",
      description: "Complete 5 tasks",
      earned: completedCount >= 5,
      color: "#3b82f6",
    },
    {
      id: "fifteen_tasks",
      name: "Platform Expert",
      nameEn: "Platform Expert",
      emoji: "🔥",
      description: "Complete 15 tasks",
      earned: completedCount >= 15,
      color: "#ef4444",
    },
    {
      id: "thirty_tasks",
      name: "Shehab Star",
      nameEn: "Shehab Star",
      emoji: "⭐",
      description: "Complete 30 tasks",
      earned: completedCount >= 30,
      color: "#f59e0b",
    },
    {
      id: "verified",
      name: "Verified",
      nameEn: "Verified",
      emoji: "✅",
      description: "Successfully verify your identity",
      earned: verificationStatus === "VERIFIED",
      color: "#10b981",
    },
    {
      id: "high_rating",
      name: "Top Rated",
      nameEn: "Top Rated",
      emoji: "🌟",
      description: "Achieve a 4.5+ rating",
      earned: rating >= 4.5,
      color: "#f59e0b",
    },
  ]
}
