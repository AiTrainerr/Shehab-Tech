"use client"

import * as React from "react"
import Link from "next/link"
import { Users, Mail, Phone, MapPin, CheckCircle, Clock, XCircle, Search, Filter } from "lucide-react"
import { AdminRatingForm } from "@/components/admin-rating-form"
import { toggleModeratorApproval, assignModeratorProject, updateModeratorPermissions } from "@/app/actions/users"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  title: string
}

export function AdminUsersClient({ initialUsers, statusConfig, projects }: { initialUsers: any[], statusConfig: any, projects: Project[] }) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email} ${u.phone || ""}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter ? u.verificationStatus === statusFilter : true
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass p-4 rounded-xl border border-border flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-foreground/40 shrink-0" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:w-auto px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="NOT_VERIFIED">Not Verified</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filteredUsers.length === 0 ? (
        <div className="glass p-12 rounded-2xl border border-border text-center">
          <Users className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/60 font-semibold">No members match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const status = statusConfig[user.verificationStatus] || statusConfig.PENDING
            return (
              <div key={user.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/20 transition-all">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-black text-primary">
                      {user.firstName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/profile/${user.id}`}>
                            <h3 className="text-lg font-bold hover:text-primary transition-colors hover:underline">
                              {user.firstName} {user.lastName}
                            </h3>
                          </Link>
                          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-card rounded-full border border-border text-foreground/60">
                            {user.ranking}
                          </span>
                          {user.role === "MODERATOR" && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full">
                              Supervisor
                            </span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm("Are you SURE you want to completely delete this user? This will delete their applications, recordings, and ALL data permanently!")) return
                            const { deleteUserAdmin } = await import("@/app/actions/user")
                            const res = await deleteUserAdmin(user.id)
                            if (res.success) {
                              window.location.reload()
                            } else {
                              alert(res.error)
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Delete User Permanently"
                        >
                          <XCircle className="w-4 h-4" /> Delete User
                        </button>
                      </div>

                      {user.role === "MEMBER" && (
                        <div className="mb-2">
                          <button
                            onClick={async () => {
                              if (!confirm(`Grant Supervisor permissions to ${user.firstName}?`)) return
                              const res = await updateModeratorPermissions(user.id, { role: "MODERATOR", isApproved: true })
                              if (res.success) router.refresh()
                              else alert(res.error)
                            }}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-bold transition-colors"
                          >
                            Grant Supervisor Permissions
                          </button>
                        </div>
                      )}

                      {/* Sensitive Info — Admin Only */}
                      <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mt-2">
                        <span className="flex items-center gap-1.5 bg-yellow-500/5 border border-yellow-500/10 px-2 py-1 rounded-lg">
                          <Mail className="w-3.5 h-3.5 text-yellow-500" />
                          <a href={`mailto:${user.email}`} className="hover:text-primary transition-colors">{user.email}</a>
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1.5 bg-yellow-500/5 border border-yellow-500/10 px-2 py-1 rounded-lg">
                            <Phone className="w-3.5 h-3.5 text-yellow-500" />
                            <a href={`tel:${user.phone}`} className="hover:text-primary transition-colors">{user.phone}</a>
                          </span>
                        )}
                        {user.country && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {user.country}
                          </span>
                        )}
                        {user.age && <span>{user.age} yrs</span>}
                        {user.gender && <span className="capitalize">{user.gender}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 lg:text-right lg:min-w-[140px] text-sm">
                    <div>
                      <p className="text-xs text-foreground/50 uppercase font-semibold">Completed</p>
                      <p className="font-black text-xl">{user.completedCount}</p>
                    </div>
                    <div className="flex flex-col items-center lg:items-end">
                      <p className="text-xs text-foreground/50 uppercase font-semibold mb-1">Set Rating</p>
                      <AdminRatingForm userId={user.id} currentRating={user.rating} />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/50 uppercase font-semibold">Applications</p>
                      <p className="font-black text-xl">{user._count.applications}</p>
                    </div>
                    {user.role === "MODERATOR" && (
                      <div>
                        <p className="text-xs text-foreground/50 uppercase font-semibold">QC Reviewed</p>
                        <p className="font-black text-xl text-purple-500">{user.reviewedCount || 0}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Moderator Controls */}
                {user.role === "MODERATOR" && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground/50">Supervisor Status:</span>
                      <button
                        onClick={async () => {
                          const confirmMsg = user.isApproved
                            ? "Revoke supervisor approval? They will not be able to log in."
                            : "Approve supervisor? They will be allowed to log in."
                          if (!confirm(confirmMsg)) return
                          const res = await toggleModeratorApproval(user.id, !user.isApproved)
                          if (res.success) {
                            router.refresh()
                          } else {
                            alert(res.error)
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          user.isApproved 
                            ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20"
                        }`}
                      >
                        {user.isApproved ? "✓ Approved (Active)" : "⏳ Pending Approval"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground/50">Assign Project:</span>
                      <select
                        value={user.assignedProjectId || ""}
                        onChange={async (e) => {
                          const val = e.target.value || null
                          const res = await assignModeratorProject(user.id, val)
                          if (res.success) {
                            router.refresh()
                          } else {
                            alert(res.error)
                          }
                        }}
                        className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary"
                      >
                        <option value="">Not Assigned</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground/50">QC Review:</span>
                      <button
                        onClick={async () => {
                          const res = await updateModeratorPermissions(user.id, { canReviewQC: !user.canReviewQC })
                          if (res.success) {
                            router.refresh()
                          } else {
                            alert(res.error)
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          user.canReviewQC
                            ? "bg-purple-500/15 text-purple-500 border border-purple-500/20 hover:bg-purple-500/25"
                            : "bg-foreground/5 text-foreground/50 border border-border hover:bg-foreground/10"
                        }`}
                      >
                        {user.canReviewQC ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground/50">Approve Applicants:</span>
                      <button
                        onClick={async () => {
                          const res = await updateModeratorPermissions(user.id, { canApproveApplications: !user.canApproveApplications })
                          if (res.success) {
                            router.refresh()
                          } else {
                            alert(res.error)
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          user.canApproveApplications
                            ? "bg-purple-500/15 text-purple-500 border border-purple-500/20 hover:bg-purple-500/25"
                            : "bg-foreground/5 text-foreground/50 border border-border hover:bg-foreground/10"
                        }`}
                      >
                        {user.canApproveApplications ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div className="ml-auto">
                      <button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to completely remove supervisor permissions for this user and return them to standard Member status?")) return
                          const res = await updateModeratorPermissions(user.id, {
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
                        }}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold transition-colors"
                      >
                        Revoke Supervisor Role
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
