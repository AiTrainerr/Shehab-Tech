"use client"

import * as React from "react"
import { Users, Clock, Edit2, CheckCircle, MoreVertical } from "lucide-react"
import { updateProjectStatus } from "@/app/actions/projects"

export function AdminProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = React.useState(initialProjects)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    setUpdatingId(projectId)
    const res = await updateProjectStatus(projectId, newStatus)
    setUpdatingId(null)
    
    if (res.success) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
    } else {
      alert(res.error || "Failed to update status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "text-green-500 bg-green-500/10 border-green-500/20"
      case "IN_PROGRESS": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "COMPLETED": return "text-blue-500 bg-blue-500/10 border-blue-500/20"
      case "CANCELLED": return "text-red-500 bg-red-500/10 border-red-500/20"
      default: return "text-foreground/50 bg-foreground/5 border-border"
    }
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="glass p-6 rounded-2xl border border-border">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{project.title}</h2>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm font-semibold text-foreground/60">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {project._count.applications} Applicants</span>
                <span className="flex items-center gap-1.5 text-primary">Price: ${Number(project.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[160px]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Change Status</label>
                <select 
                  disabled={updatingId === project.id}
                  value={project.status}
                  onChange={(e) => handleStatusChange(project.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors disabled:opacity-50"
                >
                  <option value="OPEN">🟢 Open</option>
                  <option value="IN_PROGRESS">🟡 In Progress</option>
                  <option value="COMPLETED">🔵 Completed</option>
                  <option value="CANCELLED">🔴 Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
