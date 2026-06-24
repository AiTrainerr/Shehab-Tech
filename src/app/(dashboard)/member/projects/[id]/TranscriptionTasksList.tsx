"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Headphones, CheckCircle, Clock } from "lucide-react"

export function TranscriptionTasksList({ tasks, currentUserId }: { tasks: any[], currentUserId: string }) {
  const router = useRouter()
  const [claimingId, setClaimingId] = React.useState<string | null>(null)

  const handleClaim = async (taskId: string) => {
    setClaimingId(taskId)
    try {
      const res = await fetch(`/api/transcription/${taskId}/claim`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to claim")
      }
      // Redirect to editor
      router.push(`/member/transcription/${taskId}`)
    } catch (e: any) {
      alert(e.message)
      setClaimingId(null)
    }
  }

  // Find if user already has an active task in this project
  const myActiveTask = tasks.find(t => t.assignedToId === currentUserId)

  return (
    <div className="glass p-6 rounded-2xl border border-primary/20 bg-primary/5 mb-8">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Headphones className="w-6 h-6 text-primary" />
        مهام التفريغ الصوتي المتاحة
      </h3>
      
      {myActiveTask && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="font-bold text-green-600 dark:text-green-400 mb-2">لديك مهمة قيد التنفيذ حالياً!</p>
          <button 
            onClick={() => router.push(`/member/transcription/${myActiveTask.id}`)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-sm"
          >
            إكمال التفريغ (Task #{myActiveTask.id.slice(-6)})
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {tasks.filter(t => t.status === "AVAILABLE" || t.assignedToId === currentUserId).map(task => {
          const isMine = task.assignedToId === currentUserId
          return (
            <div key={task.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div>
                <div className="font-bold text-foreground flex items-center gap-2">
                  Task #{task.id.slice(-6)}
                  {isMine && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">خاصتي</span>}
                </div>
                <div className="text-xs text-foreground/50 mt-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {task.duration ? `${Math.round(task.duration / 60)} دقيقة` : "غير محدد"}
                </div>
              </div>
              
              {!isMine && !myActiveTask && (
                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claimingId === task.id}
                  className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {claimingId === task.id ? "جاري السحب..." : "سحب المهمة"}
                </button>
              )}
            </div>
          )
        })}

        {tasks.filter(t => t.status === "AVAILABLE").length === 0 && !myActiveTask && (
          <div className="text-center p-6 text-foreground/50 border border-dashed border-border rounded-xl">
            لا توجد مهام متاحة حالياً. جميع المهام تم سحبها.
          </div>
        )}
      </div>
    </div>
  )
}
