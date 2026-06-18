"use client"

import * as React from "react"
import { addComment, deleteComment } from "@/app/actions/comments"
import { MessageSquare, Reply, Trash2, User, Loader2, X } from "lucide-react"

type CommentData = {
  id: string
  content: string
  createdAt: Date
  parentId: string | null
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    role: string
  }
}

function CommentItem({ 
  comment, 
  replies, 
  projectId, 
  currentUserId,
  onReply
}: { 
  comment: CommentData, 
  replies: CommentData[], 
  projectId: string,
  currentUserId: string,
  onReply: (parentId: string) => void
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return
    setIsDeleting(true)
    await deleteComment(comment.id, projectId)
    setIsDeleting(false)
  }

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="shrink-0">
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary/50" />
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4 shadow-sm relative group">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {comment.author.firstName} {comment.author.lastName}
              </span>
              {comment.author.role === "ADMIN" && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">Admin</span>
              )}
            </div>
            <span className="text-xs text-foreground/50 shrink-0">
              {new Date(comment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-4 mt-3">
            <button 
              onClick={() => onReply(comment.id)}
              className="text-xs font-bold text-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
            
            {(comment.author.id === currentUserId) && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs font-bold text-foreground/50 hover:text-red-500 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} 
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                replies={[]} // Only nesting 1 level deep for UI simplicity
                projectId={projectId} 
                currentUserId={currentUserId}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentsSection({ 
  projectId, 
  comments, 
  currentUserId 
}: { 
  projectId: string, 
  comments: CommentData[],
  currentUserId: string
}) {
  const [content, setContent] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [replyToId, setReplyToId] = React.useState<string | null>(null)

  const topLevelComments = comments.filter(c => !c.parentId)
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    const res = await addComment(projectId, content, replyToId || undefined)
    setIsSubmitting(false)

    if (res.success) {
      setContent("")
      setReplyToId(null)
    } else {
      alert(res.error || "Failed to post comment")
    }
  }

  const replyUser = replyToId ? comments.find(c => c.id === replyToId)?.author : null

  return (
    <div className="space-y-8 mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Discussion ({comments.length})</h3>
      </div>

      <div className="space-y-6">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-foreground/50 italic text-center py-4 bg-card rounded-2xl border border-border">
            No comments yet. Be the first to ask a question!
          </p>
        ) : (
          topLevelComments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              replies={getReplies(comment.id)} 
              projectId={projectId}
              currentUserId={currentUserId}
              onReply={(id) => {
                setReplyToId(id)
                document.getElementById('comment-input')?.focus()
              }}
            />
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm relative">
        {replyToId && replyUser && (
          <div className="flex items-center justify-between bg-primary/5 text-primary text-sm font-semibold px-4 py-2 rounded-xl mb-4">
            <span className="flex items-center gap-2">
              <Reply className="w-4 h-4" /> Replying to {replyUser.firstName}
            </span>
            <button 
              type="button" 
              onClick={() => setReplyToId(null)}
              className="hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <textarea
          id="comment-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyToId ? "Write your reply..." : "Ask a question or leave a comment..."}
          className="w-full h-24 px-4 py-3 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
          disabled={isSubmitting}
        />
        
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:bg-primary flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            {replyToId ? "Post Reply" : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  )
}
