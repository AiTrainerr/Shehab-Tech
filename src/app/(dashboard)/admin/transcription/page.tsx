import * as React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Headphones, CheckCircle, Clock, XCircle, FileText, Download, ShieldCheck } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminTranscriptionQueuePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, canReviewQC: true }
  })

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && !currentUser?.canReviewQC) {
    redirect("/admin")
  }

  const tasks = await prisma.transcriptionTask.findMany({
    include: {
      project: { select: { title: true } },
      assignedTo: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { segments: true } }
    },
    orderBy: { updatedAt: "desc" }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Headphones className="w-7 h-7 text-primary" />
            QA Queue (التفريغ الصوتي)
          </h1>
          <p className="text-foreground/60 text-sm mt-1">مراجعة المهام المسلمة وتصدير الملفات النهائية</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden animate-slide-up stagger-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/30">
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">المشروع</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">المفرغ</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">المدة / المقاطع</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">الحالة</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-foreground/40">
                    لا توجد مهام تفريغ حالياً
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{task.project.title}</div>
                      <div className="text-xs text-foreground/50 mt-0.5">Task ID: {task.id.slice(-6)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {task.assignedTo ? (
                        <>
                          <div className="font-semibold text-foreground">{task.assignedTo.firstName} {task.assignedTo.lastName}</div>
                          <div className="text-xs text-foreground/50 mt-0.5">{task.assignedTo.email}</div>
                        </>
                      ) : (
                        <span className="text-foreground/40 italic">غير معين</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{task.duration ? `${Math.round(task.duration / 60)} دقيقة` : "غير محدد"}</div>
                      <div className="text-xs text-foreground/50 mt-0.5">{task._count.segments} مقطع</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        task.status === "APPROVED" ? "bg-green-500/10 text-green-500" :
                        task.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                        task.status === "SUBMITTED" ? "bg-purple-500/10 text-purple-500" :
                        task.status === "ASSIGNED" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {task.status === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                        {task.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {task.status === "SUBMITTED" && <FileText className="w-3 h-3" />}
                        {task.status === "ASSIGNED" && <Clock className="w-3 h-3" />}
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* QA Review Button */}
                        <Link 
                          href={`/admin/transcription/qa/${task.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" /> مراجعة
                        </Link>
                        
                        {/* Export Menu */}
                        {task.status === "APPROVED" && (
                          <div className="flex items-center gap-1">
                            <a href={`/api/transcription/export/${task.id}?format=word`} download className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="تصدير Word">
                              <Download className="w-4 h-4" />
                            </a>
                            <a href={`/api/transcription/export/${task.id}?format=excel`} download className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors" title="تصدير Excel">
                              <Download className="w-4 h-4" />
                            </a>
                            <a href={`/api/transcription/export/${task.id}?format=srt`} download className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors" title="تصدير SRT">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
