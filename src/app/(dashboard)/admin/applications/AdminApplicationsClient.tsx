"use client"

import * as React from "react"
import Link from "next/link"
import { Check, X, Search, FileText, User, BadgeCheck, Mic2, Download, Clock, ChevronDown, Lock, CheckCircle2, Sliders } from "lucide-react"
import { approveApplication, rejectApplication, deleteApplication, extendApplicationTime, bulkApproveApplications } from "@/app/actions/projects"
import { setAcceptedSentencesCount } from "@/app/actions/recordings"

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
  project: { id: string; title: string; status?: string; pricingModel: string; workflowType?: string; zipNamingRule?: string }
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string | null; gender?: string | null; age?: number | null; ranking: string; verificationStatus: string }
}

type TabType = "ALL" | "READY_FIRST" | "READY_FIXED" | "NEEDS_FIX" | "WORKING" | "COMPLETED";

function MultiSelectDropdown({
  label, options, selectedValues, onChange, allLabel = "All"
}: {
  label: string; options: { label: string, value: string }[]; selectedValues: string[]; onChange: (vals: string[]) => void; allLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggle = (val: string) => selectedValues.includes(val) ? onChange(selectedValues.filter(v => v !== val)) : onChange([...selectedValues, val]);
  const isAll = selectedValues.length === 0;
  return (
    <div className="relative space-y-1.5" ref={ref}>
      <label className="text-xs font-bold text-foreground/60 uppercase">{label}</label>
      <div onClick={() => setOpen(!open)} className="w-full bg-background border border-border rounded-xl px-4 py-2 cursor-pointer flex justify-between items-center outline-none hover:border-primary transition-colors font-semibold select-none">
        <span className="truncate pr-4 text-sm">{isAll ? allLabel : `${selectedValues.length} Selected`}</span>
        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50 py-2">
          <div onClick={() => { onChange([]); setOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 cursor-pointer">
            <input type="checkbox" readOnly checked={isAll} className="w-4 h-4 rounded border-border" />
            <span className="text-sm font-bold">{allLabel}</span>
          </div>
          {options.map(opt => (
            <div key={opt.value} onClick={() => toggle(opt.value)} className="flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 cursor-pointer">
              <input type="checkbox" readOnly checked={selectedValues.includes(opt.value)} className="w-4 h-4 rounded border-border" />
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminApplicationsClient({ applications }: { applications: Application[] }) {
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [projectFilter, setProjectFilter] = React.useState<string[]>([])
  const [downloadStatusFilter, setDownloadStatusFilter] = React.useState<string[]>([])
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [loading, setLoading] = React.useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = React.useState<boolean>(false)
  const [selectedAppIds, setSelectedAppIds] = React.useState<Set<string>>(new Set())
  const [downloadedAppIds, setDownloadedAppIds] = React.useState<Set<string>>(new Set())
  
  // Custom accepted sentences modal state
  const [acceptSentencesModal, setAcceptSentencesModal] = React.useState<{
    appId: string;
    applicantName: string;
    projectTitle: string;
    recordedCount: number;
    currentAccepted: number;
  } | null>(null)
  const [acceptSentencesInput, setAcceptSentencesInput] = React.useState<number>(80)
  const [acceptTargetStatus, setAcceptTargetStatus] = React.useState<"FINAL_REVIEW" | "APPROVED">("FINAL_REVIEW")

  // Load persistent project filter from localStorage
  React.useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("admin_selected_projects")
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjectFilter(parsed)
        }
      }
    } catch (e) {}
  }, [])

  const handleProjectFilterChange = (vals: string[]) => {
    setProjectFilter(vals)
    try {
      if (vals.length > 0) {
        localStorage.setItem("admin_selected_projects", JSON.stringify(vals))
      } else {
        localStorage.removeItem("admin_selected_projects")
      }
    } catch (e) {}
  }

  const clearProjectFilter = () => {
    setProjectFilter([])
    try {
      localStorage.removeItem("admin_selected_projects")
    } catch (e) {}
  }

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('downloadedApps');
      const initialSet = new Set<string>();
      if (stored) {
        JSON.parse(stored).forEach((id: string) => initialSet.add(id));
      }
      
      const hardcoded = ["G0276", "G0277", "G0280", "G0282", "G0284", "G0285", "G0286", "G0288", "G0289", "G0292", "G0293", "G0294", "G0295", "G0296", "G0297", "G0298", "G0299", "G0301", "G0303", "G0304", "G0305", "G0307", "G0312", "G0313", "G0315", "G0316", "G0317", "U0477", "U0478", "U0479", "U0480", "U0481", "U0483", "U0484", "U0486", "U0487", "U0490", "U0491", "U0494"];
      let modified = false;
      
      applications.forEach(app => {
        if (app.speakerCode && hardcoded.includes(app.speakerCode)) {
          if (!initialSet.has(app.id)) {
            initialSet.add(app.id);
            modified = true;
          }
        }
      });
      
      setDownloadedAppIds(initialSet);
      if (modified) {
        localStorage.setItem('downloadedApps', JSON.stringify(Array.from(initialSet)));
      }
    } catch (e) {}
  }, [applications]);

  const uniqueProjects = React.useMemo(() => {
    const map = new Map();
    applications.forEach(a => {
      if (!map.has(a.project.id)) {
        map.set(a.project.id, a.project);
      }
    });
    const list = Array.from(map.values());
    const statusWeight: Record<string, number> = {
      OPEN: 1,
      IN_PROGRESS: 2,
      COMPLETED: 3,
      CANCELLED: 4,
    };
    return list.sort((a, b) => {
      const wa = statusWeight[a.status || ""] || 3;
      const wb = statusWeight[b.status || ""] || 3;
      if (wa !== wb) return wa - wb;
      return (a.title || "").localeCompare(b.title || "");
    });
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

  const handleExtendTime = async (id: string) => {
    if (!confirm("هل أنت متأكد من تمديد الوقت لهذا المستقل؟")) return
    setLoading(id)
    const res = await extendApplicationTime(id)
    if (!res.success) alert(res.error)
    else alert("تم تمديد الوقت بنجاح!")
    setLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟ (لا يمكن التراجع)")) return
    setLoading(id)
    const res = await deleteApplication(id)
    if (!res.success) alert(res.error)
    else alert("تم حذف الطلب بنجاح!")
    setLoading(null)
  }

  const handleBulkApprove = async () => {
    const toApprove = filtered.filter(app => selectedAppIds.has(app.id));
    if (toApprove.length === 0) {
      alert("Please select at least one application to approve.");
      return;
    }
    if (!confirm(`Are you sure you want to approve ${toApprove.length} selected applications?`)) return;

    setBulkLoading(true);
    const res = await bulkApproveApplications(toApprove.map(a => a.id));
    setBulkLoading(false);

    if (res.success) {
      alert(`Successfully approved ${res.approved} out of ${res.total} applications.`);
    } else {
      alert(`Error: ${res.error}. Approved ${res.approved || 0} applications.`);
    }
    setSelectedAppIds(new Set());
    window.location.reload();
  }

  const openAcceptSentencesModal = (app: Application) => {
    const total = app.recordedCount || 0
    setAcceptSentencesModal({
      appId: app.id,
      applicantName: `${app.user.firstName} ${app.user.lastName}`,
      projectTitle: app.project.title,
      recordedCount: total,
      currentAccepted: app.acceptedCount || total,
    })
    setAcceptSentencesInput(total || 80)
    setAcceptTargetStatus(app.status === "FINAL_REVIEW" ? "APPROVED" : "FINAL_REVIEW")
  }

  const handleConfirmAcceptSentences = async () => {
    if (!acceptSentencesModal) return
    setLoading(acceptSentencesModal.appId)
    const res = await setAcceptedSentencesCount(
      acceptSentencesModal.appId, 
      acceptSentencesInput, 
      acceptTargetStatus
    )
    setLoading(null)
    if (!res.success) {
      alert(res.error || "Failed to set accepted sentences count")
    } else {
      alert(`Success: Accepted ${res.acceptedCount} sentences and set status to ${acceptTargetStatus}!`)
      setAcceptSentencesModal(null)
      window.location.reload()
    }
  }

  const filtered = applications.filter(a => {
    const matchesSearch = 
      a.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.speakerCode && a.speakerCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!matchesSearch) return false;
    if (projectFilter.length > 0 && !projectFilter.includes(a.project.id)) return false;

    if (statusFilter.length > 0) {
      const isClosedWithoutRecording = a.project.status === "COMPLETED" && (!a.recordedCount || a.recordedCount === 0);
      const isClosedIncomplete = a.project.status === "COMPLETED" && a.status !== "FINAL_REVIEW" && a.status !== "APPROVED" && a.status !== "PAID" && (a.recordedCount || 0) < (a.totalSentences || 80);
      const isWorking = (a.status === "APPROVED" || a.status === "WORKING" || a.status === "ACCEPTED" || a.status === "UNDER_REVIEW") && !isClosedWithoutRecording && !isClosedIncomplete;
      const isCompleted = a.status === "COMPLETED" || a.status === "FINAL_REVIEW" || a.status === "PAID";
      const isNotStarted = isWorking && (!a.recordedCount || a.recordedCount === 0);
      const isActuallyWorking = isWorking && (a.recordedCount || 0) > 0;
      
      let matchesStatus = false;
      if (statusFilter.includes("PENDING") && a.status === "PENDING") matchesStatus = true;
      if (statusFilter.includes("FINAL_REVIEW") && a.status === "FINAL_REVIEW") matchesStatus = true;
      if (statusFilter.includes("WORKING") && isActuallyWorking) matchesStatus = true;
      if (statusFilter.includes("NOT_STARTED") && isNotStarted) matchesStatus = true;
      if (statusFilter.includes("CLOSED_NOT_RECORDED") && (isClosedWithoutRecording || isClosedIncomplete)) matchesStatus = true;
      if (statusFilter.includes("COMPLETED") && isCompleted) matchesStatus = true;
      if (statusFilter.includes("REJECTED") && a.status === "REJECTED") matchesStatus = true;

      if (!matchesStatus) return false;
    }

    if (downloadStatusFilter.length > 0) {
      let matchesDl = false;
      if (downloadStatusFilter.includes("DOWNLOADED") && downloadedAppIds.has(a.id)) matchesDl = true;
      if (downloadStatusFilter.includes("NOT_DOWNLOADED") && !downloadedAppIds.has(a.id)) matchesDl = true;
      if (!matchesDl) return false;
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

    const newDownloadedSet = new Set(downloadedAppIds);

    for (let i = 0; i < toDownload.length; i++) {
      const app = toDownload[i];
      const url = `/api/recordings/download?projectId=${app.project.id}&userId=${app.user.id}`;
      
      const a = document.createElement("a");
      a.href = url;
      a.download = ""; // Filename is provided by the server
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      newDownloadedSet.add(app.id);
      setDownloadedAppIds(new Set(newDownloadedSet));
      localStorage.setItem('downloadedApps', JSON.stringify(Array.from(newDownloadedSet)));

      // Wait 2 seconds between each download to prevent browser crashing or getting blocked
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  const handleMarkAsDownloaded = () => {
    if (selectedAppIds.size === 0) {
      alert("Please select at least one application to mark as downloaded.");
      return;
    }
    
    if (!confirm(`Are you sure you want to mark ${selectedAppIds.size} applications as Downloaded without downloading their files?`)) return;

    const newDownloadedSet = new Set(downloadedAppIds);
    selectedAppIds.forEach(id => newDownloadedSet.add(id));
    
    setDownloadedAppIds(newDownloadedSet);
    localStorage.setItem('downloadedApps', JSON.stringify(Array.from(newDownloadedSet)));
    
    setSelectedAppIds(new Set()); // Deselect after marking
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

      // Define columns schema upfront (keys and widths) without automatic headers
      worksheet.columns = [
        { key: 'project', width: 25 },
        { key: 'fileName', width: 35 },
        { key: 'name', width: 25 },
        { key: 'email', width: 30 },
        { key: 'phone', width: 15 },
        { key: 'speakerCode', width: 15 },
        { key: 'gender', width: 10 },
        { key: 'age', width: 10 },
        { key: 'status', width: 15 },
        { key: 'totalSentences', width: 15 },
        { key: 'recorded', width: 18 },
        { key: 'accepted', width: 12 },
        { key: 'needRerecord', width: 15 },
        { key: 'rejected', width: 12 },
        { key: 'pending', width: 18 },
      ];

      // === Summary KPI rows ===
      const totalSpeakers = filtered.length;
      const maleCount = filtered.filter(a => { const g = (a.user.gender || '').toLowerCase(); return g === 'male' || g === 'ذكر'; }).length;
      const femaleCount = filtered.filter(a => { const g = (a.user.gender || '').toLowerCase(); return g === 'female' || g === 'أنثى' || g === 'انثى'; }).length;
      const totalAccepted = filtered.reduce((s, a) => s + (a.acceptedCount || 0), 0);
      const totalRecorded = filtered.reduce((s, a) => s + (a.recordedCount || 0), 0);
      const totalRejected = filtered.reduce((s, a) => s + (a.rejectedCount || 0), 0);
      const totalReRecord = filtered.reduce((s, a) => s + (a.reRecordCount || 0), 0);

      const kpiStyle = { font: { bold: true, size: 12 }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } };
      const kpiValueStyle = { font: { bold: true, size: 12, color: { argb: 'FF002060' } }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } };

      const kpiRows = [
        ['DELIVERY SUMMARY REPORT', '', '', '', '', '', `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`],
        [],
        ['Total Speakers:', totalSpeakers, '', 'Male:', maleCount, 'Female:', femaleCount],
        ['Total Recorded:', totalRecorded, '', 'Accepted:', totalAccepted, 'Rejected:', totalRejected],
        ['Need Re-record:', totalReRecord],
        [],
      ];

      kpiRows.forEach((row, idx) => {
        const r = worksheet.addRow(row);
        if (idx === 0) {
          r.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF002060' } };
          r.getCell(7).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
        } else if (idx === 2 || idx === 3 || idx === 4) {
          r.getCell(1).font = kpiStyle.font;
          r.getCell(2).font = kpiValueStyle.font;
          if (row[3]) { r.getCell(4).font = kpiStyle.font; r.getCell(5).font = kpiValueStyle.font; }
          if (row[5]) { r.getCell(6).font = kpiStyle.font; r.getCell(7).font = kpiValueStyle.font; }
        }
      });

      // Data header row placed right after KPI block
      const dataHeaderRow = worksheet.addRow([
        'Project', 'File Name', 'Name', 'Email', 'Phone', 'Speaker Code',
        'Gender', 'Age', 'Status', 'Total Sentences', 'Recorded (Valid)',
        'Accepted', 'Need Re-record', 'Rejected', 'Pending (Empty)'
      ]);

      filtered.forEach(app => {
        let genderForFolder = "N-A";
        if (app.user.gender) {
          const g = app.user.gender.toLowerCase();
          if (g === "male" || g === "ذكر") genderForFolder = "male";
          else if (g === "female" || g === "أنثى" || g === "انثى") genderForFolder = "female";
          else genderForFolder = app.user.gender;
        }
        const ageFolderStr = app.user.age ? String(app.user.age) : "N-A";
        const sequentialId = (app.speakerCode && app.speakerCode !== "G_PENDING") ? app.speakerCode : "";
        const zipNamingRule = app.project.zipNamingRule || "FULL";
        
        let computedFileName = "";
        if (zipNamingRule === "SPEAKER_ONLY") {
          computedFileName = sequentialId || `${app.user.firstName}_${app.user.lastName}`;
        } else if (zipNamingRule === "ANONYMOUS") {
          computedFileName = sequentialId ? `${sequentialId}_${genderForFolder}_${ageFolderStr}` : `${genderForFolder}_${ageFolderStr}`;
        } else {
          computedFileName = [sequentialId, app.user.firstName, app.user.lastName, genderForFolder !== "N-A" ? genderForFolder : "", ageFolderStr !== "N-A" ? ageFolderStr : ""].filter(Boolean).join("_");
        }
        computedFileName = computedFileName.replace(/[\/\\:\*\?"<>\|]/g, "_").replace(/_+/g, '_').replace(/^_|_$/g, '');


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

      dataHeaderRow.eachCell((cell) => {
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

      const dataStartRow = dataHeaderRow.number;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= dataStartRow) return;
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
      a.download = `Applications_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      notStarted: { m: 0, f: 0, total: 0 },
      closedNotRecorded: { m: 0, f: 0, total: 0 },
      finalReview: { m: 0, f: 0, total: 0 },
      completed: { m: 0, f: 0, total: 0 },
      rejected: { m: 0, f: 0, total: 0 },
    }

    applications.forEach(a => {
      if (projectFilter.length > 0 && !projectFilter.includes(a.project.id)) return;

      const g = a.user?.gender?.toUpperCase() || ""
      const isMale = g === "MALE" || g === "OUO" || g === "M" || g === "ذكر"
      const isFemale = g === "FEMALE" || g === "OU+OU%" || g === "O U+OU%" || g === "F" || g === "أنثى"

      s.all.total++
      if (isMale) s.all.m++
      if (isFemale) s.all.f++

      const isClosedWithoutRecording = a.project.status === "COMPLETED" && (!a.recordedCount || a.recordedCount === 0);
      const isClosedIncomplete = a.project.status === "COMPLETED" && a.status !== "FINAL_REVIEW" && a.status !== "APPROVED" && a.status !== "PAID" && (a.recordedCount || 0) < (a.totalSentences || 80);

      if (isClosedWithoutRecording || isClosedIncomplete) {
        s.closedNotRecorded.total++
        if (isMale) s.closedNotRecorded.m++
        if (isFemale) s.closedNotRecorded.f++
      }

      if (a.status === "PENDING") {
        s.pending.total++
        if (isMale) s.pending.m++
        if (isFemale) s.pending.f++
      } else if (a.status === "FINAL_REVIEW") {
        s.finalReview.total++
        if (isMale) s.finalReview.m++
        if (isFemale) s.finalReview.f++
        s.completed.total++
        if (isMale) s.completed.m++
        if (isFemale) s.completed.f++
      } else if (a.status === "APPROVED" || a.status === "WORKING" || a.status === "ACCEPTED" || a.status === "UNDER_REVIEW") {
        if (!a.recordedCount || a.recordedCount === 0) {
          s.notStarted.total++
          if (isMale) s.notStarted.m++
          if (isFemale) s.notStarted.f++
        } else {
          s.working.total++
          if (isMale) s.working.m++
          if (isFemale) s.working.f++
        }
      } else if (a.status === "COMPLETED" || a.status === "PAID") {
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
          {selectedAppIds.size > 0 && (
            <button 
              onClick={handleBulkApprove}
              disabled={bulkLoading}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> {bulkLoading ? "Approving..." : `Approve Selected (${selectedAppIds.size})`}
            </button>
          )}
          <button 
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={handleMarkAsDownloaded}
            className="flex-1 sm:flex-none px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
          >
            <BadgeCheck className="w-4 h-4" /> Mark as Downloaded
          </button>
          <button 
            onClick={handleDownloadAll}
            className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> Download ZIPs ({selectedAppIds.size})
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card p-4 rounded-2xl border border-border">
        <MultiSelectDropdown 
          label="Applicant Acceptance Status"
          allLabel={`All Applicants (${stats.all.total}) - M: ${stats.all.m} | F: ${stats.all.f}`}
          options={[
            { value: "PENDING", label: `Pending (${stats.pending.total}) - M: ${stats.pending.m} | F: ${stats.pending.f}` },
            { value: "FINAL_REVIEW", label: `Final Review (${stats.finalReview.total}) - M: ${stats.finalReview.m} | F: ${stats.finalReview.f}` },
            { value: "WORKING", label: `Working (${stats.working.total}) - M: ${stats.working.m} | F: ${stats.working.f}` },
            { value: "NOT_STARTED", label: `Not Started (${stats.notStarted.total}) - M: ${stats.notStarted.m} | F: ${stats.notStarted.f}` },
            { value: "CLOSED_NOT_RECORDED", label: `🔒 Closed Incomplete/0 (${stats.closedNotRecorded.total}) - M: ${stats.closedNotRecorded.m} | F: ${stats.closedNotRecorded.f}` },
            { value: "COMPLETED", label: `Completed/Approved (${stats.completed.total}) - M: ${stats.completed.m} | F: ${stats.completed.f}` },
            { value: "REJECTED", label: `Rejected (${stats.rejected.total}) - M: ${stats.rejected.m} | F: ${stats.rejected.f}` }
          ]}
          selectedValues={statusFilter}
          onChange={setStatusFilter}
        />

        <div className="flex flex-col gap-1">
          <MultiSelectDropdown 
            label="Project Name"
            allLabel={projectFilter.length > 0 ? `${projectFilter.length} Selected (Saved)` : "All Projects"}
            options={uniqueProjects.map(p => ({ 
              label: p.status === "COMPLETED" ? `${p.title} (Closed 🔒)` : p.status === "CANCELLED" ? `${p.title} (Archived 📦)` : p.title, 
              value: p.id 
            }))}
            selectedValues={projectFilter}
            onChange={handleProjectFilterChange}
          />
          {projectFilter.length > 0 && (
            <button 
              onClick={clearProjectFilter}
              className="text-xs text-primary font-bold hover:underline self-start flex items-center gap-1 pt-1"
            >
              <X className="w-3 h-3" /> Clear Saved Project Filter ({projectFilter.length})
            </button>
          )}
        </div>

        <MultiSelectDropdown 
          label="Download Status"
          allLabel="All"
          options={[
            { label: "Downloaded", value: "DOWNLOADED" },
            { label: "Not Downloaded", value: "NOT_DOWNLOADED" }
          ]}
          selectedValues={downloadStatusFilter}
          onChange={setDownloadStatusFilter}
        />
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
                {app.project.status === 'COMPLETED' && (!app.recordedCount || app.recordedCount === 0) ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                    <Lock className="w-3 h-3" /> Closed (0 Recorded)
                  </span>
                ) : app.project.status === 'COMPLETED' && app.status !== 'FINAL_REVIEW' && app.status !== 'APPROVED' && app.status !== 'PAID' && (app.recordedCount || 0) < (app.totalSentences || 80) ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/25">
                    <Lock className="w-3 h-3" /> Closed Incomplete ({app.recordedCount || 0}/{app.totalSentences || 0})
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    app.status === 'APPROVED' || app.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    app.status === 'WORKING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    app.status === 'UNDER_REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    app.status === 'FINAL_REVIEW' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' :
                    app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {app.status === 'APPROVED' || app.status === 'PAID' ? <Check className="w-3 h-3" /> : null}
                    {app.status === 'FINAL_REVIEW' || app.status === 'UNDER_REVIEW' ? <Clock className="w-3 h-3" /> : null}
                    {app.status === 'REJECTED' ? <X className="w-3 h-3" /> : null}
                    {app.status.replace("_", " ")}
                  </span>
                )}
                {downloadedAppIds.has(app.id) && (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500/20 text-green-600 dark:text-green-400">
                    ✅ Downloaded
                  </span>
                )}
              </div>
              {app.speakerCode && (
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {app.speakerCode}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-xl font-black text-foreground">
                  {app.project.title}
                </h3>
                {app.project.status === 'COMPLETED' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">
                    <Lock className="w-2.5 h-2.5" /> Project Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/50 flex items-center gap-1 mt-2">
                <FileText className="w-3 h-3" /> Project ID: {app.project.id.slice(0, 8)}...
              </p>
              
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
                      Recorded: {app.recordedCount || 0} / {app.totalSentences || 0}
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
                
                {(app.status === 'PENDING' || app.status === 'FINAL_REVIEW' || app.status === 'UNDER_REVIEW') && (
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
                        <BadgeCheck className="w-4 h-4" /> QC
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

                  {(app.recordedCount || 0) > 0 && (
                    <button
                      onClick={() => openAcceptSentencesModal(app)}
                      disabled={loading === app.id}
                      className="w-full px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-emerald-500/20 disabled:opacity-50"
                      title="Set accepted sentences count and approve"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Accept Sentences ({app.acceptedCount ?? app.recordedCount}/{app.recordedCount})
                    </button>
                  )}

                  {app.status === 'UNDER_REVIEW' && (app.totalSentences || 0) === 0 && (
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={loading === app.id}
                      className="w-full px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve Proof
                    </button>
                  )}

                  {(app.status === 'WORKING' || app.status === 'UNDER_REVIEW' || app.status === 'ACCEPTED') && (
                    <>
                      <button
                        onClick={() => handleExtendTime(app.id)}
                        disabled={loading === app.id}
                        className="w-full px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        title="تمديد الوقت 24 ساعة إضافية"
                      >
                        <Clock className="w-4 h-4" /> تمديد الوقت
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("هل أنت متأكد من إلغاء التاسك وحذف كل تسجيلات هذا المستخدم؟ (سيتم تبليغه فوراً بالرفض)")) return;
                          setLoading(app.id);
                          const res = await rejectApplication(app.id, "تم رفضك بسبب ضعف الجودة أو انتهاء الوقت");
                          if (!res.success) alert(res.error);
                          else window.location.reload();
                          setLoading(null);
                        }}
                        disabled={loading === app.id}
                        className="w-full px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        title="إلغاء التاسك ورفض المستخدم"
                      >
                        <X className="w-4 h-4" /> إلغاء التاسك
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={loading === app.id}
                    className="w-full px-4 py-2 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    title="حذف الطلب نهائياً ليبدأ من جديد"
                  >
                    <X className="w-4 h-4" /> حذف نهائي
                  </button>
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

      {acceptSentencesModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-2 text-emerald-500 font-black">
              <Sliders className="w-5 h-5" />
              <h3 className="text-xl font-bold text-foreground">Set Accepted Sentences</h3>
            </div>
            <p className="text-sm text-foreground/70 mb-4">
              Specify how many recorded sentences to accept for <span className="font-bold text-foreground">{acceptSentencesModal.applicantName}</span> in project <span className="font-bold text-foreground">{acceptSentencesModal.projectTitle}</span>.
            </p>

            <div className="bg-background border border-border rounded-2xl p-4 mb-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase block mb-1">
                  Number of Accepted Sentences (Max: {acceptSentencesModal.recordedCount})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={acceptSentencesModal.recordedCount}
                    value={acceptSentencesInput}
                    onChange={(e) => setAcceptSentencesInput(Math.min(acceptSentencesModal.recordedCount, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-card border border-border rounded-xl px-4 py-2 font-bold text-lg outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setAcceptSentencesInput(acceptSentencesModal.recordedCount)}
                    className="px-3 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 whitespace-nowrap"
                  >
                    All ({acceptSentencesModal.recordedCount})
                  </button>
                </div>
                <p className="text-[11px] text-foreground/50 mt-1">
                  Sentences 1 to {acceptSentencesInput} will be marked <span className="text-emerald-500 font-bold">ACCEPTED</span>. The remaining {Math.max(0, acceptSentencesModal.recordedCount - acceptSentencesInput)} will be marked <span className="text-rose-500 font-bold">REJECTED</span>.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase block mb-1">
                  Target Application Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAcceptTargetStatus("FINAL_REVIEW")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      acceptTargetStatus === "FINAL_REVIEW"
                        ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20"
                        : "bg-card border-border hover:bg-foreground/5"
                    }`}
                  >
                    Final Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcceptTargetStatus("APPROVED")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      acceptTargetStatus === "APPROVED"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-card border-border hover:bg-foreground/5"
                    }`}
                  >
                    Approved
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAcceptSentencesModal(null)}
                className="flex-1 px-4 py-2 rounded-xl font-bold bg-background border border-border hover:bg-foreground/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcceptSentences}
                disabled={loading === acceptSentencesModal.appId}
                className="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === acceptSentencesModal.appId ? "Saving..." : "Apply & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

