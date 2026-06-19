"use client"

import * as React from "react"
import { addComment, deleteComment } from "@/app/actions/comments"
import { MessageSquare, Reply, Trash2, User, Loader2, X, ShieldCheck } from "lucide-react"

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
  currentUserRole,
  onReply
}: { 
  comment: CommentData, 
  replies: CommentData[], 
  projectId: string,
  currentUserId: string,
  currentUserRole: string,
  onReply: (parentId: string, authorName: string) => void
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isAdmin = currentUserRole === "ADMIN"
  const isOwner = comment.author.id === currentUserId
  const canDelete = isOwner || isAdmin

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
        <div className={`bg-card border rounded-2xl rounded-tl-none p-4 shadow-sm relative group transition-colors
          ${isAdmin && !isOwner ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}
        >
          {/* Admin badge on their own comments */}
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {comment.author.firstName} {comment.author.lastName}
              </span>
              {comment.author.role === "ADMIN" && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
            <span className="text-xs text-foreground/50 shrink-0">
              {new Date(comment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <button 
              onClick={() => onReply(comment.id, `${comment.author.firstName} ${comment.author.lastName}`)}
              className="text-xs font-bold text-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
            
            {canDelete && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className={`text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50
                  ${isAdmin && !isOwner 
                    ? "text-red-400 hover:text-red-500" 
                    : "text-foreground/40 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  }`}
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} 
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-4 mt-4 ml-4 pl-4 border-l-2 border-border">
            {replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                replies={[]}
                projectId={projectId} 
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
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
  currentUserId,
  currentUserRole = "MEMBER"
}: { 
  projectId: string, 
  comments: CommentData[],
  currentUserId: string,
  currentUserRole?: string
}) {
  const [content, setContent] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [replyToId, setReplyToId] = React.useState<string | null>(null)
  const [replyToName, setReplyToName] = React.useState<string>("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const topLevelComments = comments.filter(c => !c.parentId)
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId)

  const handleReply = (parentId: string, authorName: string) => {
    setReplyToId(parentId)
    setReplyToName(authorName)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    const res = await addComment(projectId, content, replyToId || undefined)
    setIsSubmitting(false)

    if (res.success) {
      setContent("")
      setReplyToId(null)
      setReplyToName("")
    } else {
      alert(res.error || "Failed to post comment")
    }
  }

  const isAdmin = currentUserRole === "ADMIN"

  return (
    <div className="space-y-8 mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Discussion ({comments.length})</h3>
        {isAdmin && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Mode — you can delete any comment
          </span>
        )}
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
              currentUserRole={currentUserRole}
              onReply={handleReply}
            />
          ))
        )}
      </div>

      {/* Add Comment / Reply Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm">
        {replyToId && replyToName && (
          <div className="flex items-center justify-between bg-primary/5 text-primary text-sm font-semibold px-4 py-2 rounded-xl mb-4">
            <span className="flex items-center gap-2">
              <Reply className="w-4 h-4" /> Replying to <strong>{replyToName}</strong>
            </span>
            <button 
              type="button" 
              onClick={() => { setReplyToId(null); setReplyToName("") }}
              className="hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isAdmin
              ? replyToId ? "Write your admin reply..." : "Write an admin comment..."
              : replyToId ? "Write your reply..." : "Ask a question or leave a comment..."
          }
          className="w-full h-24 px-4 py-3 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
          disabled={isSubmitting}
        />
        
        <div className="flex justify-between items-center mt-4">
          {isAdmin && (
            <span className="text-xs text-foreground/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Posting as Admin
            </span>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="ml-auto px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            {replyToId ? "Post Reply" : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  )
}
