"use client"

import * as React from "react"
import Link from "next/link"
import { Check, X, Search, FileText, User, BadgeCheck, Mic2 } from "lucide-react"
import { approveApplication, rejectApplication } from "@/app/actions/projects"

interface Application {
  id: string
  status: string
  createdAt: Date
  recordedCount?: number
  totalSentences?: number
  isCompleted?: boolean
  reviewCategory?: string
  pendingCount?: number
  reRecordCount?: number
  acceptedCount?: number
  speakerCode?: string | null
  proofUrl?: string | null
  projectRole?: string
  project: { id: string; title: string; pricingModel: string; workflowType?: string }
  user: { id: string; firstName: string; lastName: string; email: string; ranking: string; verificationStatus: string }
}

type TabType = "ALL" | "READY_FIRST" | "READY_FIXED" | "NEEDS_FIX" | "WORKING" | "COMPLETED";

export function AdminApplicationsClient({ applications }: { applications: Application[] }) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [projectFilter, setProjectFilter] = React.useState<string>("ALL")
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [loading, setLoading] = React.useState<string | null>(null)

  const uniqueProjects = React.useMemo(() => {
    const map = new Map();
    applications.forEach(a => {
      if (!map.has(a.project.id)) {
        map.set(a.project.id, a.project);
      }
    });
    return Array.from(map.values());
  }, [applications]);

  const [rejectId, setRejectId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this application?")) return
    setLoading(id)
    const res = await approveApplication(id)
    if (!res.success) alert(res.error)
    setLoading(null)
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.")
      return
    }
    setLoading(id)
    const res = await rejectApplication(id, rejectReason)
    if (!res.success) alert(res.error)
    setLoading(null)
    setRejectId(null)
    setRejectReason("")
  }

  const filtered = applications.filter(a => {
    const matchesSearch = 
      a.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.speakerCode && a.speakerCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!matchesSearch) return false;
    if (projectFilter !== "ALL" && a.project.id !== projectFilter) return false;

    if (statusFilter !== "ALL") {
      if (statusFilter === "PENDING" && a.status !== "PENDING") return false;
      if (statusFilter === "APPROVED" && a.status !== "APPROVED" && a.status !== "WORKING") return false;
      if (statusFilter === "REJECTED" && a.status !== "REJECTED") return false;
      if (statusFilter === "COMPLETED" && a.status !== "COMPLETED" && a.status !== "FINAL_REVIEW" && a.status !== "PAID") return false;
    }
    
    return true;
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search by code, name or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:border-primary outline-none"
          />
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground/60 uppercase">Applicant Acceptance Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2 outline-none focus:border-primary font-semibold"
          >
            <option value="ALL">All Applicants</option>
            <option value="PENDING">Pending Approval (Needs Action)</option>
            <option value="APPROVED">Approved / Working</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground/60 uppercase">Project Name</label>
          <select 
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2 outline-none focus:border-primary font-semibold"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((app) => (
          <div key={app.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-colors flex flex-col h-full relative">
            
            {/* Action Overlay */}
            {loading === app.id && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  app.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                  app.status === 'WORKING' ? 'bg-blue-500/10 text-blue-500' :
                  app.status === 'UNDER_REVIEW' ? 'bg-yellow-500/10 text-yellow-500' :
                  app.status === 'FINAL_REVIEW' ? 'bg-purple-500/10 text-purple-500' :
                  app.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                  'bg-primary/10 text-primary'
                }`}>
                  {app.status.replace("_", " ")}
                </span>
              </div>
              {app.speakerCode && (
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {app.speakerCode}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-foreground mb-1">
                {app.project.title}
              </h3>
              <p className="text-xs text-foreground/50 flex items-center gap-1 mt-2">
                <FileText className="w-3 h-3" /> Project ID: {app.project.id.slice(0, 8)}...
              </p>
              
              {app.totalSentences !== undefined && app.totalSentences > 0 && (
                <div className={`mt-3 p-2.5 rounded-lg border flex flex-col gap-1.5 text-xs font-bold ${
                  app.reviewCategory === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                  app.reviewCategory === 'READY_FIRST' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                  app.reviewCategory === 'READY_FIXED' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' :
                  app.reviewCategory === 'NEEDS_FIX' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400' :
                  'bg-primary/5 border-primary/10 text-primary'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {app.reviewCategory === 'COMPLETED' ? <Check className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5" />}
                      Recorded: {app.recordedCount || 0} / {app.totalSentences}
                    </span>
                    <span className="uppercase tracking-wider">
                      {app.reviewCategory === 'COMPLETED' ? 'Completed' :
                       app.reviewCategory === 'READY_FIRST' ? 'Needs Review' :
                       app.reviewCategory === 'READY_FIXED' ? 'Fixes Submitted' :
                       app.reviewCategory === 'NEEDS_FIX' ? 'Needs Fix' : 'Working'}
                    </span>
                  </div>
                  {/* Detail counts */}
                  {(app.reviewCategory !== 'WORKING' && app.reviewCategory !== 'COMPLETED') && (
                    <div className="flex gap-3 mt-1 pt-1 border-t border-current/10 text-[10px] font-semibold opacity-80">
                      <span>Accepted: {app.acceptedCount}</span>
                      <span>Pending: {app.pendingCount}</span>
                      <span>Rejected: {app.reRecordCount}</span>
                    </div>
                  )}
                </div>
              )}
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
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                    <BadgeCheck className="w-3.5 h-3.5 text-white fill-green-500" /> Verified
                  </span>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <div className="flex gap-2">
                <Link 
                  href={`/profile/${app.user.id}`} 
                  target="_blank"
                  className="flex-1 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                  <User className="w-4 h-4" /> Profile
                </Link>
                
                {(app.status === 'PENDING' || app.status === 'FINAL_REVIEW') && (
                  <>
                    <button 
                      onClick={() => setRejectId(app.id)}
                      disabled={loading === app.id}
                      className="p-2 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      title={app.status === 'FINAL_REVIEW' ? "Reject Project Review" : "Reject Application"}>
                      <X className="w-5 h-5" />
                    </button>
                    {app.project.workflowType === "MOD_AND_QC" && app.projectRole !== "QC" && (
                      <button 
                        onClick={async () => {
                          if (!confirm("Promote this user to QC? They will only review tasks for this project.")) return;
                          setLoading(app.id);
                          const { promoteToQC } = await import("@/app/actions/projects");
                          const res = await promoteToQC(app.id);
                          if (!res.success) alert(res.error);
                          setLoading(null);
                        }}
                        disabled={loading === app.id}
                        className="flex-1 px-2 py-2 bg-purple-500/10 text-purple-600 font-bold text-xs rounded-xl hover:bg-purple-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        title="Promote to QC">
                        Promote to QC
                      </button>
                    )}
                    <button 
                      onClick={() => handleApprove(app.id)}
                      disabled={loading === app.id}
                      className="p-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                      title={app.status === 'FINAL_REVIEW' ? "Approve Project Review" : "Approve Application"}>
                      <Check className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {app.proofUrl && (
                <div className="mb-4 bg-background/50 border border-border p-3 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground/70 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Task Proof
                  </span>
                  <a href={app.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                    View Screenshot
                  </a>
                </div>
              )}

              {app.status !== 'PENDING' && (
                (app.totalSentences || 0) > 0 ? (
                  <Link
                    href={`/admin/applications/${app.id}/review`}
                    className={`w-full px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      app.status === 'UNDER_REVIEW' 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/20' 
                        : 'bg-card border border-border hover:border-primary/50'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> 
                    {app.status === 'UNDER_REVIEW' ? 'Review Recordings' : 'View Recordings'}
                  </Link>
                ) : (
                  app.status === 'UNDER_REVIEW' && (
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={loading === app.id}
                      className="w-full px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve Proof
                    </button>
                  )
                )
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

      {rejectId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-2">Reject Application</h3>
            <p className="text-sm text-foreground/60 mb-6">Please provide a reason for rejecting this application. This will be sent to the user as a notification.</p>
            <div className="flex flex-col gap-2 mb-4">
              <button onClick={() => setRejectReason("الشخص المتقدم غير نيتف (Not a Native Speaker)")} className="text-left text-sm px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-border">الشخص المتقدم غير نيتف</button>
              <button onClick={() => setRejectReason("لم يتم تحديث الصفحة الشخصية والبورتفوليو (Profile/Portfolio not updated)")} className="text-left text-sm px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-border">لم يتم تحديث الصفحة الشخصية والبورتفوليو</button>
              <button onClick={() => setRejectReason("هذا المشروع يحتاج توثيق حساب (Account verification required)")} className="text-left text-sm px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-border">هذا المشروع يحتاج توثيق حساب (Verification)</button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Or type a custom reason..."
              className="w-full bg-background border border-border rounded-xl p-3 min-h-[100px] mb-6 focus:border-red-500 outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectId(null)
                  setRejectReason("")
                }}
                className="flex-1 px-4 py-2 rounded-xl font-bold bg-background border border-border hover:bg-foreground/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectId)}
                disabled={loading === rejectId || !rejectReason.trim()}
                className="flex-1 px-4 py-2 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading === rejectId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
