"use client"

import * as React from "react"
import Link from "next/link"
import { Check, X, Search, FileText, User, BadgeCheck, Mic2, Download } from "lucide-react"
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
  rejectedCount?: number
  speakerCode?: string | null
  proofUrl?: string | null
  projectRole?: string
  project: { id: string; title: string; pricingModel: string; workflowType?: string; zipNamingRule?: string }
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string | null; gender?: string | null; age?: number | null; ranking: string; verificationStatus: string }
}

type TabType = "ALL" | "READY_FIRST" | "READY_FIXED" | "NEEDS_FIX" | "WORKING" | "COMPLETED";

export function AdminApplicationsClient({ applications }: { applications: Application[] }) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [projectFilter, setProjectFilter] = React.useState<string>("ALL")
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [loading, setLoading] = React.useState<string | null>(null)
  const [selectedAppIds, setSelectedAppIds] = React.useState<Set<string>>(new Set())

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

  const handleDownloadAll = async () => {
    const toDownload = filtered.filter(app => selectedAppIds.has(app.id));
    
    if (toDownload.length === 0) {
      alert("Please select at least one application to download.");
      return;
    }
    
    if (!confirm(`Are you sure you want to download ${toDownload.length} ZIP files? This will download them one by one to your computer.`)) return;

    for (let i = 0; i < toDownload.length; i++) {
      const app = toDownload[i];
      const url = `/api/recordings/download?projectId=${app.project.id}&userId=${app.user.id}`;
      
      const a = document.createElement("a");
      a.href = url;
      a.download = ""; // Filename is provided by the server
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Wait 2 seconds between each download to prevent browser crashing or getting blocked
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      alert("No data to export.");
      return;
    }

    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Applications');

      worksheet.columns = [
        { header: 'Project', key: 'project', width: 25 },
        { header: 'File Name', key: 'fileName', width: 35 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Speaker Code', key: 'speakerCode', width: 15 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Age', key: 'age', width: 10 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Total Sentences', key: 'totalSentences', width: 15 },
        { header: 'Recorded (Valid)', key: 'recorded', width: 18 },
        { header: 'Accepted', key: 'accepted', width: 12 },
        { header: 'Need Re-record', key: 'needRerecord', width: 15 },
        { header: 'Rejected', key: 'rejected', width: 12 },
        { header: 'Pending (Empty)', key: 'pending', width: 18 },
      ];

      filtered.forEach(app => {
        let genderForFolder = "N-A";
        if (app.user.gender) {
          const g = app.user.gender.toLowerCase();
          if (g === "male" || g === "ذكر") genderForFolder = "male";
          else if (g === "female" || g === "أنثى" || g === "انثى") genderForFolder = "female";
          else genderForFolder = app.user.gender;
        }
        const ageFolderStr = app.user.age ? String(app.user.age) : "N-A";
        const sequentialId = app.speakerCode || "G_PENDING";
        const zipNamingRule = app.project.zipNamingRule || "FULL";
        
        let computedFileName = "";
        if (sequentialId !== "G_PENDING" && zipNamingRule === "SPEAKER_ONLY") {
          computedFileName = sequentialId;
        } else if (sequentialId !== "G_PENDING" && zipNamingRule === "ANONYMOUS") {
          computedFileName = `${sequentialId}_${ageFolderStr}_${genderForFolder}`;
        } else {
          computedFileName = `${sequentialId}_${app.user.firstName}_${app.user.lastName}_${ageFolderStr}_${genderForFolder}`;
        }

        worksheet.addRow({
          project: app.project.title,
          fileName: computedFileName,
          name: `${app.user.firstName} ${app.user.lastName}`,
          email: app.user.email,
          phone: app.user.phone || '',
          speakerCode: app.speakerCode || '',
          gender: app.user.gender || '',
          age: app.user.age || '',
          status: app.status,
          totalSentences: app.totalSentences || 0,
          recorded: app.recordedCount || 0,
          accepted: app.acceptedCount || 0,
          needRerecord: app.reRecordCount || 0,
          rejected: app.rejectedCount || 0,
          pending: app.pendingCount || 0
        });
      });

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF002060' }
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          if ((colNumber === 11 || colNumber === 12) && typeof cell.value === 'number' && cell.value > 0) {
            cell.font = { color: { argb: 'FFFF0000' } };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Applications_Report.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating Excel:", err);
      alert("Failed to generate Excel file.");
    }
  };

  const stats = React.useMemo(() => {
    const s = {
      all: { m: 0, f: 0, total: 0 },
      pending: { m: 0, f: 0, total: 0 },
      working: { m: 0, f: 0, total: 0 },
      completed: { m: 0, f: 0, total: 0 },
      rejected: { m: 0, f: 0, total: 0 },
    }

    applications.forEach(a => {
      if (projectFilter !== "ALL" && a.project.id !== projectFilter) return;

      const g = a.user?.gender?.toUpperCase() || ""
      const isMale = g === "MALE" || g === "ذكر"
      const isFemale = g === "FEMALE" || g === "أنثى" || g === "انثى"

      s.all.total++
      if (isMale) s.all.m++
      if (isFemale) s.all.f++

      if (a.status === "PENDING") {
        s.pending.total++
        if (isMale) s.pending.m++
        if (isFemale) s.pending.f++
      } else if (a.status === "APPROVED" || a.status === "WORKING" || a.status === "ACCEPTED" || a.status === "UNDER_REVIEW") {
        s.working.total++
        if (isMale) s.working.m++
        if (isFemale) s.working.f++
      } else if (a.status === "COMPLETED" || a.status === "FINAL_REVIEW" || a.status === "PAID") {
        s.completed.total++
        if (isMale) s.completed.m++
        if (isFemale) s.completed.f++
      } else if (a.status === "REJECTED") {
        s.rejected.total++
        if (isMale) s.rejected.m++
        if (isFemale) s.rejected.f++
      }
    })
    return s
  }, [applications, projectFilter])

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
        <div className="flex flex-wrap w-full sm:w-auto gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => {
              if (selectedAppIds.size === filtered.length && filtered.length > 0) {
                setSelectedAppIds(new Set());
              } else {
                setSelectedAppIds(new Set(filtered.map(a => a.id)));
              }
            }}
            className="flex-1 sm:flex-none px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> {selectedAppIds.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={handleDownloadAll}
            className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> Download ZIPs ({selectedAppIds.size})
          </button>
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
            <option value="ALL">All Applicants ({stats.all.total}) - M: {stats.all.m} | F: {stats.all.f}</option>
            <option value="PENDING">Pending Approval ({stats.pending.total}) - M: {stats.pending.m} | F: {stats.pending.f}</option>
            <option value="APPROVED">Approved / Working ({stats.working.total}) - M: {stats.working.m} | F: {stats.working.f}</option>
            <option value="COMPLETED">Completed ({stats.completed.total}) - M: {stats.completed.m} | F: {stats.completed.f}</option>
            <option value="REJECTED">Rejected ({stats.rejected.total}) - M: {stats.rejected.m} | F: {stats.rejected.f}</option>
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
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-border text-primary cursor-pointer accent-primary"
                  checked={selectedAppIds.has(app.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedAppIds);
                    if (e.target.checked) newSet.add(app.id);
                    else newSet.delete(app.id);
                    setSelectedAppIds(newSet);
                  }}
                />
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
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{app.user.firstName} {app.user.lastName}</p>
                  <div className="flex flex-col mt-0.5 space-y-0.5">
                    <p className="text-[11px] text-foreground/50 truncate"><span className="opacity-70">Email:</span> {app.user.email}</p>
                    <p className="text-[11px] text-foreground/50 truncate"><span className="opacity-70">Phone:</span> {app.user.phone || "N/A"}</p>
                    <p className="text-[11px] text-foreground/50 truncate"><span className="opacity-70">Gender:</span> {app.user.gender || "N/A"}</p>
                  </div>
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
                <div className="flex flex-col gap-2 w-full">
                  {(app.totalSentences || 0) > 0 ? (
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
                  )}

                  {(app.status === 'WORKING' || app.status === 'UNDER_REVIEW' || app.status === 'ACCEPTED') && (
                    <button
                      onClick={async () => {
                        if (!confirm("هل أنت متأكد من تحرير التاسك وحذف كل تسجيلات هذا المستخدم؟ (سيتلقى إشعاراً بالرفض)")) return;
                        setLoading(app.id);
                        const res = await rejectApplication(app.id, "تم الرفض بسبب عدم إكمال التاسك");
                        if (!res.success) alert(res.error);
                        else window.location.reload();
                        setLoading(null);
                      }}
                      disabled={loading === app.id}
                      className="w-full px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      title="تحرير التاسك ورفض المستخدم"
                    >
                      <X className="w-4 h-4" /> تحرير التاسك
                    </button>
                  )}
                </div>
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
              <button onClick={() => setRejectReason("الشخص المتقدم غير نيتف")} className="text-left text-sm px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-border">الشخص المتقدم غير نيتف</button>
              <button onClick={() => setRejectReason("لم يتم تحديث الصفحة الشخصية والبورتفوليو")} className="text-left text-sm px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-border">لم يتم تحديث الصفحة الشخصية والبورتفوليو</button>
              <button onClick={() => setRejectReason("هذا المشروع يحتاج توثيق حساب")} className="text-left text-sm px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-border">هذا المشروع يحتاج توثيق حساب</button>
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
