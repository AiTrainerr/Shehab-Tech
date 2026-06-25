"use client"

import * as React from "react"
import { Shield, Mail, CheckSquare, Square, Check, Loader2, AlertCircle } from "lucide-react"
import { grantSupervisorPermissions } from "@/app/actions/permissions"

interface Project {
  id: string
  title: string
}

export function GrantPermissionsForm({ projects }: { projects: Project[] }) {
  const [email, setEmail] = React.useState("")
  const [selectedProject, setSelectedProject] = React.useState("")
  const [canReviewQC, setCanReviewQC] = React.useState(true)
  const [canApproveApplications, setCanApproveApplications] = React.useState(false)
  const [moderatorType, setModeratorType] = React.useState<"INTERNAL" | "OUTSOURCED">("INTERNAL")
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Auto-select the first project if available
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects, selectedProject])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address." })
      setIsLoading(false)
      return
    }

    if (!selectedProject) {
      setMessage({ type: "error", text: "Please select a project." })
      setIsLoading(false)
      return
    }

    const result = await grantSupervisorPermissions(
      email.trim(),
      selectedProject,
      canReviewQC,
      canApproveApplications,
      moderatorType
    )

    setIsLoading(false)
    if (result.success) {
      setMessage({ type: "success", text: `Successfully granted supervisor permissions to ${email}.` })
      setEmail("")
    } else {
      setMessage({ type: "error", text: result.error || "Something went wrong." })
    }
  }

  return (
    <div className="glass p-6 sm:p-8 rounded-2xl border border-border shadow-lg relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Grant Supervisor Permissions</h2>
          <p className="text-xs text-foreground/50">Assign project-specific roles & dashboard access by email</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {message && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm transition-all ${
              message.type === "success"
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Email Input */}
        <div>
          <label htmlFor="mod-email" className="block text-sm font-semibold text-foreground/80 mb-2">
            User Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              id="mod-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. supervisor@shehab-tech.com"
              className="w-full pl-10 pr-4 py-2.5 bg-card/50 border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Project Select */}
        <div>
          <label htmlFor="mod-project" className="block text-sm font-semibold text-foreground/80 mb-2">
            Assigned Project
          </label>
          <select
            id="mod-project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-card/50 border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            disabled={isLoading}
            required
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Moderator Type Selection */}
        <div>
          <span className="block text-sm font-semibold text-foreground/80 mb-2">Moderator Type</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setModeratorType("INTERNAL")}
              disabled={isLoading}
              className={`p-3 rounded-xl border text-left transition-all ${
                moderatorType === "INTERNAL"
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-card/30 border-border text-foreground/60 hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  moderatorType === "INTERNAL" ? "border-blue-500" : "border-foreground/30"
                }`}>
                  {moderatorType === "INTERNAL" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <p className={`text-sm font-bold ${moderatorType === "INTERNAL" ? "text-blue-500" : ""}`}>Platform Admin</p>
              </div>
              <p className="text-xxs text-foreground/60 pl-6">Internal team. Manages the general freelancer pool.</p>
            </button>

            <button
              type="button"
              onClick={() => setModeratorType("OUTSOURCED")}
              disabled={isLoading}
              className={`p-3 rounded-xl border text-left transition-all ${
                moderatorType === "OUTSOURCED"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-card/30 border-border text-foreground/60 hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  moderatorType === "OUTSOURCED" ? "border-emerald-500" : "border-foreground/30"
                }`}>
                  {moderatorType === "OUTSOURCED" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <p className={`text-sm font-bold ${moderatorType === "OUTSOURCED" ? "text-emerald-500" : ""}`}>Team Leader</p>
              </div>
              <p className="text-xxs text-foreground/60 pl-6">Outsourced team. Manages ONLY their own team members.</p>
            </button>
          </div>
        </div>

        {/* Permissions Toggles */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <span className="block text-sm font-semibold text-foreground/80">Permissions Scope</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* QC Permission */}
            <button
              type="button"
              onClick={() => setCanReviewQC(!canReviewQC)}
              disabled={isLoading}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                canReviewQC
                  ? "bg-primary/5 border-primary/20 text-foreground"
                  : "bg-card/30 border-border text-foreground/60 hover:border-foreground/20"
              }`}
            >
              {canReviewQC ? (
                <CheckSquare className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-foreground/30 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">Team Leader (Project Supervisor)</p>
                <p className="text-xxs text-foreground/50">Manage assigned project & review team recordings</p>
              </div>
            </button>

            {/* Applications Permission */}
            <button
              type="button"
              onClick={() => setCanApproveApplications(!canApproveApplications)}
              disabled={isLoading}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                canApproveApplications
                  ? "bg-primary/5 border-primary/20 text-foreground"
                  : "bg-card/30 border-border text-foreground/60 hover:border-foreground/20"
              }`}
            >
              {canApproveApplications ? (
                <CheckSquare className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-foreground/30 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">Platform Admin (Manage Applicants)</p>
                <p className="text-xxs text-foreground/50">Accept/decline requests & manage platform applicants</p>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Permissions...</span>
            </>
          ) : (
            <span>Grant Permissions</span>
          )}
        </button>
      </form>
    </div>
  )
}
