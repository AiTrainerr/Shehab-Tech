"use client"

import * as React from "react"
import Link from "next/link"
import { Check, X, Search, FileText, User } from "lucide-react"
import { approveApplication, rejectApplication } from "@/app/actions/projects"

interface Application {
  id: string
  status: string
  createdAt: Date
  project: { id: string; title: string }
  user: { id: string; firstName: string; lastName: string; email: string; ranking: string; verificationStatus: string }
}

export function AdminApplicationsClient({ applications }: { applications: Application[] }) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this application?")) return
    setLoading(id)
    const res = await approveApplication(id)
    if (!res.success) alert(res.error)
    setLoading(null)
  }

  const handleReject = async (id: string) => {
    if (!confirm("Reject this application?")) return
    setLoading(id)
    const res = await rejectApplication(id)
    if (!res.success) alert(res.error)
    setLoading(null)
  }

  const filtered = applications.filter(a => 
    a.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search by name or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((app) => (
          <div key={app.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-colors flex flex-col h-full">
            <div className="mb-4">
              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border mb-3
                ${app.status === 'PENDING' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 
                  app.status === 'APPROVED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 
                  'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                {app.status}
              </span>
              <h3 className="text-lg font-bold text-foreground line-clamp-2" title={app.project.title}>
                {app.project.title}
              </h3>
              <p className="text-xs text-foreground/50 flex items-center gap-1 mt-2">
                <FileText className="w-3 h-3" /> Project ID: {app.project.id.slice(0, 8)}...
              </p>
            </div>

            <div className="bg-background rounded-xl p-4 border border-border flex-1 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {app.user.firstName[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{app.user.firstName} {app.user.lastName}</p>
                  <p className="text-xs text-foreground/50 truncate">{app.user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-foreground/5 text-foreground/70">
                  {app.user.ranking}
                </span>
                {app.user.verificationStatus === "VERIFIED" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-500/10 text-green-500">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <Link 
                href={`/profile/${app.user.id}`} 
                target="_blank"
                className="flex-1 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                <User className="w-4 h-4" /> Profile
              </Link>
              
              {app.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => handleReject(app.id)}
                    disabled={loading === app.id}
                    className="p-2 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Reject">
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleApprove(app.id)}
                    disabled={loading === app.id}
                    className="p-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                    title="Approve">
                    <Check className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-foreground/50 bg-card rounded-2xl border border-border border-dashed">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No applications found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
