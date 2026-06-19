import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, Mic, User, FileText } from "lucide-react"
import Link from "next/link"
import { ReviewClient } from "./ReviewClient"

export default async function AdminReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, canReviewQC: true }
  })
  
  if (currentUser?.role === "MODERATOR" && !currentUser.canReviewQC) {
    redirect("/admin")
  }
  
  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN" && currentUser?.role !== "MODERATOR") {
    redirect("/member")
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: true,
      project: true
    }
  })

  if (!application) notFound()

  // Fetch sentences and their recordings for this specific user
  const sentences = await prisma.projectSentence.findMany({
    where: { projectId: application.projectId },
    orderBy: { order: "asc" },
    include: {
      recordings: {
        where: { userId: application.userId }
      }
    }
  })

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Applications
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-bold">
            <Mic className="w-3.5 h-3.5" /> QC Review Session
          </div>
        </div>

        <div className="glass p-6 sm:p-8 rounded-2xl border border-border mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Review Recordings</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60">
                <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Project: <strong>{application.project.title}</strong></span>
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> Freelancer: <strong>{application.user.firstName} {application.user.lastName}</strong></span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full border
                ${application.status === 'UNDER_REVIEW' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 
                  application.status === 'APPROVED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 
                  'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                {application.status}
              </span>
            </div>
          </div>
        </div>

        <ReviewClient 
          application={application}
          sentences={sentences}
        />
      </div>
    </div>
  )
}
