"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle, Clock, XCircle, FileText, Download, ShieldCheck, Unlock, Ban } from "lucide-react"
import { unassignTranscriptionTask, suspendUserFromTranscriptionProject } from "@/app/actions/transcription-admin"

interface TranscriptionTaskData {
  id: string
  projectId: string
  status: string
  duration: number | null
  assignedTo: { id: string; firstName: string; lastName: string; email: string } | null
  qcAssignedTo: { id: string; firstName: string; lastName: string; email: string } | null
  project: { title: string }
  _count: { segments: number }
}

export function AdminTranscriptionClient({ tasks }: { tasks: TranscriptionTaskData[] }) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [suspendLoadingId, setSuspendLoadingId] = React.useState<string | null>(null)

  // Filtering State
  const [filterProject, setFilterProject] = React.useState<string>("ALL")
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL")
  const [searchUser, setSearchUser] = React.useState<string>("")

  // Derived filter options
  const uniqueProjects = React.useMemo(() => Array.from(new Set(tasks.map(t => t.project.title))), [tasks])
  
  // Filtered Tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      if (filterProject !== "ALL" && task.project.title !== filterProject) return false
      if (filterStatus !== "ALL" && task.status !== filterStatus) return false
      
      if (searchUser) {
        const query = searchUser.toLowerCase()
        const user = task.assignedTo || task.qcAssignedTo
        if (!user) return false
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        if (!fullName.includes(query) && !user.email.toLowerCase().includes(query)) return false
      }
      
      return true
    })
  }, [tasks, filterProject, filterStatus, searchUser])

  const handleUnassign = async (taskId: string) => {
    if (!confirm("Are you sure you want to unassign this task and return it to the queue?")) return
    setLoadingId(taskId)
    const res = await unassignTranscriptionTask(taskId)
    if (!res.success) alert(res.error)
    setLoadingId(null)
  }

  const handleSuspendUser = async (userId: string, projectId: string) => {
    if (!confirm("⚠️ WARNING: Are you sure you want to suspend this user from this project?\n\nThis will reject their application and withdraw ALL their claimed tasks immediately.")) return
    setSuspendLoadingId(`${userId}_${projectId}`)
    const res = await suspendUserFromTranscriptionProject(userId, projectId)
    if (!res.success) alert(res.error)
    setSuspendLoadingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass rounded-2xl border border-border p-4 animate-slide-up flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-foreground/50 mb-1">Project</label>
          <select 
            value={filterProject} 
            onChange={e => setFilterProject(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-foreground/50 mb-1">Status</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_QC_REVIEW">UNDER_QC_REVIEW</option>
            <option value="SUBMITTED_TO_QC">SUBMITTED_TO_QC</option>
            <option value="APPROVED_BY_QC">APPROVED_BY_QC</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-foreground/50 mb-1">Search Freelancer</label>
          <input 
            type="text" 
            placeholder="Name or Email..."
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden animate-slide-up stagger-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/30">
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">Project</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">Freelancer / QC</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">Duration / Segments</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 font-bold text-foreground/50 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-foreground/40">
                    No transcription tasks match your filters
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                // Determine who is currently working on it
                let activeUser = task.assignedTo
                let roleLabel = "Transcriber"
                if (task.status === "UNDER_QC_REVIEW" && task.qcAssignedTo) {
                    activeUser = task.qcAssignedTo
                    roleLabel = "QC Reviewer"
                }

                return (
                  <tr key={task.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{task.project.title}</div>
                      <div className="text-xs text-foreground/50 mt-0.5">Task ID: {task.id.slice(-6)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {activeUser ? (
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-foreground">
                                {activeUser.firstName} {activeUser.lastName}
                                <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{roleLabel}</span>
                            </div>
                            <div className="text-xs text-foreground/50 mt-0.5">{activeUser.email}</div>
                          </div>
                          <button
                            onClick={() => handleSuspendUser(activeUser.id, task.projectId)}
                            disabled={suspendLoadingId === `${activeUser.id}_${task.projectId}`}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Suspend User from Project"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-foreground/40 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{task.duration ? `${Math.round(task.duration / 60)} minutes` : "Unknown"}</div>
                      <div className="text-xs text-foreground/50 mt-0.5">{task._count.segments} segments</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        task.status === "APPROVED" || task.status === "APPROVED_BY_QC" ? "bg-green-500/10 text-green-500" :
                        task.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                        task.status === "SUBMITTED" || task.status === "SUBMITTED_TO_QC" ? "bg-purple-500/10 text-purple-500" :
                        task.status === "ASSIGNED" || task.status === "UNDER_QC_REVIEW" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {(task.status === "APPROVED" || task.status === "APPROVED_BY_QC") && <CheckCircle className="w-3 h-3" />}
                        {task.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {(task.status === "SUBMITTED" || task.status === "SUBMITTED_TO_QC") && <FileText className="w-3 h-3" />}
                        {(task.status === "ASSIGNED" || task.status === "UNDER_QC_REVIEW") && <Clock className="w-3 h-3" />}
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* QA Review Button */}
                        <Link 
                          href={`/admin/transcription/qa/${task.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" /> Review
                        </Link>

                        {/* Unassign Button */}
                        {(task.status === "ASSIGNED" || task.status === "UNDER_QC_REVIEW") && (
                            <button
                                onClick={() => handleUnassign(task.id)}
                                disabled={loadingId === task.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                title="Unassign Task"
                            >
                                <Unlock className="w-4 h-4" /> Free
                            </button>
                        )}
                        
                        {/* Export Menu */}
                        {(task.status === "APPROVED" || task.status === "APPROVED_BY_QC") && (
                          <div className="flex items-center gap-1">
                            <a href={`/api/transcription/export/${task.id}?format=word`} download className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Export Word">
                              <Download className="w-4 h-4" />
                            </a>
                            <a href={`/api/transcription/export/${task.id}?format=excel`} download className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors" title="Export Excel">
                              <Download className="w-4 h-4" />
                            </a>
                            <a href={`/api/transcription/export/${task.id}?format=srt`} download className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors" title="Export SRT">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}
