"use client"

import * as React from "react"
import { Trash2, ChevronDown, ChevronUp, MessageSquare, Search, ExternalLink, Reply, AlertTriangle } from "lucide-react"
import { deleteComment } from "@/app/actions/comments"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Reply = {
  id: string
  content: string
  createdAt: Date
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null; role: string }
}

type Comment = {
  id: string
  content: string
  createdAt: Date
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null; role: string }
  project: { id: string; title: string }
  replies: Reply[]
  _count: { replies: number }
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function RoleBadge({ role }: { role: string }) {
  const color =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? "bg-purple-500/15 text-purple-500 border-purple-500/20"
      : "bg-primary/10 text-primary border-primary/20"
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {role === "SUPER_ADMIN" ? "SUPER ADMIN" : role}
    </span>
  )
}

function Avatar({ user }: { user: { firstName: string; lastName: string; avatarUrl: string | null } }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center text-xs shrink-0">
      {user.firstName[0]}{user.lastName[0]}
    </div>
  )
}

export function CommentsAdminClient({ comments }: { comments: Comment[] }) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<{ id: string; projectId: string } | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async (commentId: string, projectId: string) => {
    setDeletingId(commentId)
    await deleteComment(commentId, projectId)
    setDeletingId(null)
    setConfirmDelete(null)
    router.refresh()
  }

  const filtered = comments.filter(c => {
    const q = search.toLowerCase()
    return (
      c.content.toLowerCase().includes(q) ||
      c.author.firstName.toLowerCase().includes(q) ||
      c.author.lastName.toLowerCase().includes(q) ||
      c.project.title.toLowerCase().includes(q)
    )
  })

  // Group by project
  const grouped = React.useMemo(() => {
    const map = new Map<string, { project: Comment["project"]; items: Comment[] }>()
    filtered.forEach(c => {
      if (!map.has(c.project.id)) {
        map.set(c.project.id, { project: c.project, items: [] })
      }
      map.get(c.project.id)!.items.push(c)
    })
    return Array.from(map.values())
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Search by content, author, or project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass p-7 rounded-2xl border border-border w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-500/15 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-black text-lg">Delete Comment?</h3>
            </div>
            <p className="text-sm text-foreground/60 mb-6">
              This will permanently delete the comment and all its replies. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-card border border-border rounded-xl font-bold text-sm hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id, confirmDelete.projectId)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deletingId === confirmDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments grouped by project */}
      {grouped.length === 0 ? (
        <div className="glass p-16 rounded-2xl border border-border text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-foreground/20" />
          <p className="text-foreground/40 font-semibold">
            {search ? "No comments match your search." : "No comments yet."}
          </p>
        </div>
      ) : (
        grouped.map(({ project, items }) => (
          <div key={project.id} className="glass rounded-2xl border border-border overflow-hidden">
            {/* Project Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-primary/5 border-b border-border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">{project.title}</h2>
                <span className="text-xs font-semibold text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded-full">
                  {items.length} comment{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Link
                href={`/member/projects/${project.id}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                View Project <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Comments List */}
            <div className="divide-y divide-border">
              {items.map(comment => {
                const isExpanded = expandedIds.has(comment.id)
                return (
                  <div key={comment.id} className="p-5">
                    {/* Comment Row */}
                    <div className="flex gap-3">
                      <Avatar user={comment.author} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-bold text-sm">
                            {comment.author.firstName} {comment.author.lastName}
                          </span>
                          <RoleBadge role={comment.author.role} />
                          <span className="text-xs text-foreground/40">{timeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>

                        {/* Replies toggle */}
                        {comment._count.replies > 0 && (
                          <button
                            onClick={() => toggleExpand(comment.id)}
                            className="flex items-center gap-1.5 mt-2 text-xs font-bold text-primary hover:underline"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            {isExpanded ? "Hide" : "Show"} {comment._count.replies} repl{comment._count.replies === 1 ? "y" : "ies"}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => setConfirmDelete({ id: comment.id, projectId: comment.project.id })}
                        className="p-2 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Replies */}
                    {isExpanded && comment.replies.length > 0 && (
                      <div className="mt-4 ml-11 space-y-3 border-l-2 border-primary/20 pl-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar user={reply.author} />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-bold text-sm">
                                  {reply.author.firstName} {reply.author.lastName}
                                </span>
                                <RoleBadge role={reply.author.role} />
                                <span className="text-xs text-foreground/40">{timeAgo(reply.createdAt)}</span>
                              </div>
                              <p className="text-sm text-foreground/70 leading-relaxed">{reply.content}</p>
                            </div>
                            <button
                              onClick={() => setConfirmDelete({ id: reply.id, projectId: comment.project.id })}
                              className="p-2 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                              title="Delete reply"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
