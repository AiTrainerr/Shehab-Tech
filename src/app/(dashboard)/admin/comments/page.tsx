import * as React from "react"
import { prisma } from "@/lib/prisma"
import { CommentsAdminClient } from "./CommentsAdminClient"
import { MessageSquare } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminCommentsPage() {
  // Fetch all comments with author and project info, including replies
  const comments = await prisma.comment.findMany({
    where: { parentId: null }, // top-level only; replies are nested
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

  const totalComments = await prisma.comment.count()
  const totalReplies  = await prisma.comment.count({ where: { parentId: { not: null } } })

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
