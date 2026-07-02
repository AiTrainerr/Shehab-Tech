"use client"

import * as React from "react"
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { getBatchCodesStatus, deleteBatchCode } from "@/app/actions/projects"

type CodeStatus = {
  speakerCode: string;
  assignedUser: string | null;
  status: string;
}

export function BatchCodesManager({ projectId }: { projectId: string }) {
  const [codes, setCodes] = React.useState<CodeStatus[]>([])
  const [loading, setLoading] = React.useState(true)
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [error, setError] = React.useState("")

  const fetchCodes = async () => {
    setLoading(true)
    setError("")
    const res = await getBatchCodesStatus(projectId)
    if (res.success && res.data) {
      setCodes(res.data)
    } else {
      setError(res.error || "Failed to load codes.")
    }
    setLoading(false)
  }

  React.useEffect(() => {
    fetchCodes()
  }, [projectId])

  const handleDelete = async (speakerCode: string) => {
    if (!confirm(`Are you sure you want to delete ${speakerCode}? This cannot be undone.`)) return
    
    setDeleting(speakerCode)
    setError("")
    const res = await deleteBatchCode(projectId, speakerCode)
    if (res.success) {
      await fetchCodes()
    } else {
      setError(res.error || "Failed to delete code.")
    }
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-primary/5 rounded-2xl border border-border">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 font-semibold">Loading speaker codes...</span>
      </div>
    )
  }

  if (codes.length === 0) {
    return null; // Don't show if there are no batch codes
  }

  return (
    <div className="mt-4 p-5 bg-background border border-border rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Uploaded Batch Codes</h3>
        <button 
          onClick={fetchCodes}
          className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {codes.map(c => {
          const isUnassigned = c.status === "UNASSIGNED";
          const isCompleted = ["SUBMITTED", "UNDER_REVIEW", "PAID"].includes(c.status);
          
          return (
            <div key={c.speakerCode} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUnassigned ? 'bg-foreground/5 text-foreground/50' : isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                  {isUnassigned ? <Clock className="w-4 h-4" /> : isCompleted ? <CheckCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{c.speakerCode}</p>
                  <p className="text-xs text-foreground/60">
                    {isUnassigned ? "Available / Unassigned" : `${c.status} - ${c.assignedUser || 'Unknown User'}`}
                  </p>
                </div>
              </div>
              
              {isUnassigned && (
                <button
                  onClick={() => handleDelete(c.speakerCode)}
                  disabled={deleting === c.speakerCode}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Code"
                >
                  {deleting === c.speakerCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
