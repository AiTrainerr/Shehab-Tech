import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getUserLevel, getUserBadges, getLevelProgress, getNextLevel, LEVELS } from "@/lib/gamification"
import { LevelCard, BadgesGrid } from "@/components/achievement-badge"
import { ProgressBar } from "@/components/progress-bar"
import { Trophy, Star, CheckCircle, Target } from "lucide-react"

export default async function AchievementsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, completedCount: true, rating: true, verificationStatus: true }
  })
  if (!user) redirect("/api/auth/logout?reason=deleted")

  const level    = getUserLevel(user.completedCount)
  const progress = getLevelProgress(user.completedCount)
  const nextLevel = getNextLevel(user.completedCount)
  const badges   = getUserBadges({
    completedCount: user.completedCount,
    rating: user.rating,
    verificationStatus: user.verificationStatus,
  })
  const earnedBadgesCount = badges.filter(b => b.earned).length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="animate-slide-up">
        <span className="text-sm font-bold text-primary uppercase tracking-wider">Gamification</span>
        <h1 className="text-3xl font-black text-foreground mt-1 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          إنجازاتك
        </h1>
        <p className="text-foreground/60 mt-1">تابع مستواك وشاراتك وتقدمك على المنصة</p>
      </div>

      {/* Level Card */}
      <div className="animate-slide-up stagger-1">
        <LevelCard
          level={level}
          progress={progress}
          completedCount={user.completedCount}
          nextLevel={nextLevel}
        />
      </div>

      {/* All Levels Roadmap */}
      <div className="glass p-6 rounded-2xl border border-border animate-slide-up stagger-2">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> خريطة المستويات
        </h2>
        <div className="space-y-4">
          {LEVELS.map((lvl, i) => {
            const isCurrentLevel = lvl.label === level.label
            const isPast = LEVELS.indexOf(level) > i
            const isFuture = LEVELS.indexOf(level) < i

            return (
              <div
                key={lvl.label}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isCurrentLevel ? "border-primary/40 bg-primary/5" :
                  isPast ? "border-green-500/20 bg-green-500/5 opacity-70" :
                  "border-border opacity-40"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${lvl.cssClass}`}>
                  {lvl.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{lvl.label} <span className="text-foreground/40 text-sm">({lvl.labelEn})</span></h3>
                    {isCurrentLevel && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">الحالي</span>
                    )}
                    {isPast && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">✓ مكتمل</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {lvl.maxCompleted ? `${lvl.minCompleted} – ${lvl.maxCompleted} مهمة` : `${lvl.minCompleted}+ مهمة`}
                  </p>
                  {isCurrentLevel && (
                    <div className="mt-2">
                      <ProgressBar value={progress} size="sm" showPercent={false} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up stagger-3">
        {[
          { icon: CheckCircle, label: "مهام مكتملة", value: user.completedCount, color: "text-green-500 bg-green-500/10" },
          { icon: Star, label: "التقييم", value: user.rating > 0 ? user.rating.toFixed(1) : "—", color: "text-yellow-500 bg-yellow-500/10" },
          { icon: Trophy, label: "شارات مكتسبة", value: `${earnedBadgesCount}/${badges.length}`, color: "text-purple-500 bg-purple-500/10" },
        ].map(stat => (
          <div key={stat.label} className="glass p-4 rounded-2xl border border-border text-center">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs text-foreground/50 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="glass p-6 rounded-2xl border border-border animate-slide-up stagger-4">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> الشارات
        </h2>
        <BadgesGrid badges={badges} />
      </div>
    </div>
  )
}
