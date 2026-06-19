import * as React from "react"
import { prisma } from "@/lib/prisma"
import { CommentsAdminClient } from "./CommentsAdminClient"
import { MessageSquare } from "lucide-react"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminCommentsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, assignedProjectId: true }
  })

  const isModerator = currentUser?.role === "MODERATOR"
  const assignedProjectId = currentUser?.assignedProjectId || "none"

  const whereClause: any = { parentId: null }
  if (isModerator) {
    whereClause.projectId = assignedProjectId
  }

  // Fetch comments
  const comments = await prisma.comment.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      project: { select: { id: true, title: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        }
      },
      _count: { select: { replies: true } }
    }
  })

  const totalComments = await prisma.comment.count({
    where: isModerator ? { projectId: assignedProjectId } : {}
  })
  const totalReplies  = await prisma.comment.count({
    where: { 
      parentId: { not: null },
      ...(isModerator ? { projectId: assignedProjectId } : {})
    }
  })

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">Comments Management</h1>
          <p className="text-foreground/60 mt-0.5">
            <span className="font-semibold text-foreground">{totalComments}</span> total comments ·{" "}
            <span className="font-semibold text-foreground">{totalReplies}</span> replies
          </p>
        </div>
      </div>

      <CommentsAdminClient comments={comments} />
    </main>
  )
}
