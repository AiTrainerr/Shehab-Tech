"use client"

import * as React from "react"
import { Copy, Check, Download, Trash2 } from "lucide-react"
import { updateTeamRole, freeTask, downloadTeamReport } from "@/app/actions/team"

interface TeamActionsProps {
  action: "copy" | "updateRole" | "freeTask" | "downloadReport"
  payload?: string
  memberId?: string
  currentRole?: string
  taskId?: string
  disabled?: boolean
}

export function TeamActions({ action, payload, memberId, currentRole, taskId, disabled }: TeamActionsProps) {
  const [copied, setCopied] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  if (action === "copy" && payload) {
    return (
      <button 
        onClick={() => {
          navigator.clipboard.writeText(payload)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="p-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
        title="Copy Link"
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
      </button>
    )
  }

  if (action === "updateRole" && memberId) {
    return (
      <select
        value={currentRole}
        disabled={isPending}
        onChange={async (e) => {
          setIsPending(true)
          await updateTeamRole(memberId, e.target.value)
          setIsPending(false)
        }}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
      >
        <option value="TRANSCRIBER">Role: Transcriber (MOD)</option>
        <option value="QC">Role: Quality Control (QC)</option>
      </select>
    )
  }

  if (action === "freeTask" && taskId) {
    return (
      <button
        disabled={disabled || isPending}
        onClick={async () => {
          if (confirm("Are you sure you want to unassign this task from the current member?")) {
            setIsPending(true)
            await freeTask(taskId)
            setIsPending(false)
          }
        }}
        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs font-semibold"
        title="Free Task"
      >
        {isPending ? "Freeing..." : <><Trash2 className="w-4 h-4" /> Free</>}
      </button>
    )
  }

  if (action === "downloadReport") {
    return (
      <button
        disabled={isPending}
        onClick={async () => {
          setIsPending(true)
          const result = await downloadTeamReport()
          if (result.success && result.url) {
            window.open(result.url, "_blank")
          } else {
            alert(result.error || "Failed to generate report")
          }
          setIsPending(false)
        }}
        className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
      >
        <Download className="w-5 h-5" />
        {isPending ? "Generating..." : "Download Report (Word)"}
      </button>
    )
  }

  return null
}
