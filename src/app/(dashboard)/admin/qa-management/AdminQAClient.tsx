"use client"

import * as React from "react"
import { Shield, X, Loader2 } from "lucide-react"
import { assignQA, revokeQA } from "@/app/actions/qa"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  title: string
}

interface QAUser {
  id: string
  firstName: string
  lastName: string
  email: string
  assignedProjects: Project[]
}

export function AdminQAClient({ projects, qas }: { projects: Project[], qas: QAUser[] }) {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [selectedProject, setSelectedProject] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{type: "success"|"error", text: string} | null>(null)
  const [revokingId, setRevokingId] = React.useState<string | null>(null)

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !selectedProject) return

    setIsLoading(true)
    setMessage(null)

    const res = await assignQA(email, selectedProject)
    if (res.success) {
      setMessage({ type: "success", text: "QA assigned successfully!" })
      setEmail("")
      router.refresh()
    } else {
      setMessage({ type: "error", text: res.error || "Failed to assign QA" })
    }
    setIsLoading(false)
  }

  const handleRevoke = async (qaId: string, projectId: string) => {
    if (!confirm("Are you sure you want to revoke QA access for this project?")) return
    
    setRevokingId(`${qaId}-${projectId}`)
    const res = await revokeQA(qaId, projectId)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Failed to revoke QA")
    }
    setRevokingId(null)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Assign Form */}
      <div className="lg:col-span-1">
        <div className="glass p-6 rounded-2xl border border-border sticky top-24">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Assign QA
          </h2>
          
          <form onSubmit={handleAssign} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {message.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold mb-1">User Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                placeholder="freelancer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Select Project</label>
              <select
                required
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              >
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || projects.length === 0}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Grant QA Access
            </button>
          </form>
        </div>
      </div>

      {/* QA List */}
      <div className="lg:col-span-2">
        <div className="glass rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-card/50">
            <h2 className="text-xl font-bold">Your QA Team ({qas.length})</h2>
          </div>
          
          {qas.length === 0 ? (
            <div className="p-12 text-center text-foreground/50">
              You haven't assigned any QAs yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {qas.map(qa => (
                <div key={qa.id} className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{qa.firstName} {qa.lastName}</h3>
                    <p className="text-sm text-foreground/60">{qa.email}</p>
                  </div>
                  
                  <div className="space-y-2 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Assigned Projects</span>
                    {qa.assignedProjects.length === 0 && <span className="text-xs block text-foreground/50">None</span>}
                    {qa.assignedProjects.map(proj => (
                      <div key={proj.id} className="flex items-center justify-between gap-3 bg-background border border-border rounded-lg px-3 py-1.5">
                        <span className="text-sm font-medium">{proj.title}</span>
                        <button
                          onClick={() => handleRevoke(qa.id, proj.id)}
                          disabled={revokingId === `${qa.id}-${proj.id}`}
                          className="text-red-500 hover:bg-red-500/10 p-1 rounded-md transition-colors disabled:opacity-50"
                          title="Revoke access"
                        >
                          {revokingId === `${qa.id}-${proj.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
