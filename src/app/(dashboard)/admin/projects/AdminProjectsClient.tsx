"use client"

import * as React from "react"
import Link from "next/link"
import { Users, Clock, Edit2, CheckCircle, MoreVertical } from "lucide-react"
import { updateProjectStatus } from "@/app/actions/projects"

export function AdminProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = React.useState(initialProjects)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [role, setRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    const cookiesObj = Object.fromEntries(
      document.cookie.split("; ").map((row) => {
        const parts = row.split("=")
        return [parts[0], parts[1]]
      })
    )
    setRole(cookiesObj["userRole"] || null)
  }, [])

  const isModerator = role === "MODERATOR"

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    if (isModerator) return
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

  const activeProjects = projects.filter(p => p.status === "OPEN" || p.status === "IN_PROGRESS")
  const pastProjects = projects.filter(p => p.status === "COMPLETED")
  const cancelledProjects = projects.filter(p => p.status === "CANCELLED")

  const ProjectCard = ({ project }: { project: any }) => (
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
          {!isModerator && (
            <Link href={`/admin/projects/edit/${project.id}`} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-bold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
              <Edit2 className="w-4 h-4" /> Edit Details
            </Link>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
              {isModerator ? "Project Status" : "Change Status"}
            </label>
            <select 
              disabled={isModerator || updatingId === project.id}
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
  )

  return (
    <div className="space-y-12">
      {/* Active Projects */}
      <div>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          Active Projects <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{activeProjects.length}</span>
        </h2>
        {activeProjects.length === 0 ? (
          <p className="text-foreground/50 italic p-4 bg-background/50 rounded-xl border border-border">No active projects right now.</p>
        ) : (
          <div className="space-y-4">
            {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* Past Projects */}
      <div>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-foreground/60">
          Past Projects <span className="text-sm font-bold bg-foreground/10 text-foreground px-3 py-1 rounded-full">{pastProjects.length}</span>
        </h2>
        {pastProjects.length === 0 ? (
          <p className="text-foreground/50 italic p-4 bg-background/50 rounded-xl border border-border">No past projects.</p>
        ) : (
          <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity">
            {pastProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* Cancelled Projects (Dedicated Section) */}
      <div className="pt-6 border-t border-red-500/10">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-red-500/80">
          Cancelled Projects <span className="text-sm font-bold bg-red-500/10 text-red-500 px-3 py-1 rounded-full">{cancelledProjects.length}</span>
        </h2>
        {cancelledProjects.length === 0 ? (
          <p className="text-foreground/50 italic p-4 bg-background/50 rounded-xl border border-border">No cancelled projects.</p>
        ) : (
          <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity">
            {cancelledProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
