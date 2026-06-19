import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { QcReviewPanel } from "@/components/qc-review-panel"

export const dynamic = 'force-dynamic'

export default async function AdminQcPage() {
  const pendingRecordings = await prisma.voiceRecording.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      sentence: {
        select: {
          text: true,
          project: { select: { title: true } }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Overview
          </Link>
          <h1 className="text-3xl font-black text-foreground">Quality Control Panel</h1>
          <p className="text-foreground/70">Verify recorded sentence audio criteria, review constraints, and manage freelancer submissions.</p>
        </div>

        <QcReviewPanel initialRecordings={pendingRecordings} />
      </div>
    </div>
  )
}
