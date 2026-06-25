"use client"

import * as React from "react"
import Link from "next/link"
import { Shield, MessageSquare, Mic2, XCircle } from "lucide-react"
import { updateModeratorPermissions } from "@/app/actions/users"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  title: string
}

interface Supervisor {
  id: string
  firstName: string
  lastName: string
  email: string
  isApproved: boolean
  assignedProjectId: string | null
  canReviewQC: boolean
  canApproveApplications: boolean
  reviewedCount: number
  _count: {
    comments: number
    teamMembers: number
  }
}

export function AdminSupervisorsClient({ 
  supervisors, 
  projects 
}: { 
  supervisors: Supervisor[]
  projects: Project[] 
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to completely remove supervisor permissions for this user and return them to standard Member status?")) return
    
    setLoadingId(id)
    const res = await updateModeratorPermissions(id, {
      role: "MEMBER",
      assignedProjectId: null,
      canReviewQC: false,
      canApproveApplications: false,
      isApproved: false
    })
    
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error)
    }
    setLoadingId(null)
  }

  return (
    <div className="glass p-6 rounded-2xl border border-border h-full max-h-[500px] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Current Supervisors</h2>
        <Link href="/admin/users" className="text-sm font-semibold text-primary hover:underline">Manage All</Link>
      </div>
      
      <div className="space-y-4">
        {supervisors.length === 0 ? (
          <div className="text-center py-8 text-foreground/40">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No supervisors found</p>
          </div>
        ) : (
          supervisors.map((mod) => {
            const assignedProject = projects.find(p => p.id === mod.assignedProjectId)
            return (
              <div key={mod.id} className="p-4 bg-background rounded-xl border border-border flex flex-col gap-3 group relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{mod.firstName} {mod.lastName}</h4>
                    <p className="text-xs text-foreground/60">{mod.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      mod.isApproved ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {mod.isApproved ? "Active" : "Pending"}
                    </span>
                    <button
                      onClick={() => handleRevoke(mod.id)}
                      disabled={loadingId === mod.id}
                      className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Revoke Supervisor Role"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold" title="Total Sentences Reviewed">
                    <Mic2 className="w-3.5 h-3.5" />
                    <span>{mod.reviewedCount || 0} Reviewed</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-foreground/5 rounded-lg text-xs font-bold text-foreground/70" title="Total Comments Made">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{mod._count.comments || 0} Comments</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold" title="Team Members">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{mod._count.teamMembers || 0} Team Members</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground/50">Roles:</span>
                  <div className="flex flex-col gap-1">
                    {mod.canReviewQC && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 w-fit">
                        Team Leader (QC)
                      </span>
                    )}
                    {mod.canApproveApplications && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 w-fit">
                        Platform Admin (Applicants)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground/50">Assigned Project:</span>
                    <span className="text-xs font-bold text-primary max-w-[150px] truncate" title={assignedProject?.title || "None"}>
                      {assignedProject?.title || "None"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
