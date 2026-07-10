const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/admin/applications/AdminApplicationsClient.tsx.backup', 'utf8');

const multiSelectComponent = `
import { ChevronDown } from "lucide-react";

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  allLabel = "All"
}: {
  label: string;
  options: { label: string, value: string }[];
  selectedValues: string[];
  onChange: (vals: string[]) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const isAll = selectedValues.length === 0;

  return (
    <div className="relative space-y-1.5" ref={ref}>
      <label className="text-xs font-bold text-foreground/60 uppercase">{label}</label>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full bg-background border border-border rounded-xl px-4 py-2 cursor-pointer flex justify-between items-center outline-none hover:border-primary transition-colors font-semibold select-none"
      >
        <span className="truncate pr-4 text-sm">
          {isAll ? allLabel : \`\${selectedValues.length} Selected\`}
        </span>
        <ChevronDown className={\`w-4 h-4 opacity-50 transition-transform \${open ? 'rotate-180' : ''}\`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50 py-2">
          <div 
            onClick={() => { onChange([]); setOpen(false); }}
            className="flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 cursor-pointer"
          >
            <input type="checkbox" readOnly checked={isAll} className="w-4 h-4 rounded border-border" />
            <span className="text-sm font-bold">{allLabel}</span>
          </div>
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 cursor-pointer"
            >
              <input type="checkbox" readOnly checked={selectedValues.includes(opt.value)} className="w-4 h-4 rounded border-border" />
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
`;

content = content.replace('import { Check, X, Search, FileText, User, BadgeCheck, Mic2, Download, Clock } from "lucide-react"', 'import { Check, X, Search, FileText, User, BadgeCheck, Mic2, Download, Clock, ChevronDown } from "lucide-react"');

content = content.replace('const [statusFilter, setStatusFilter] = React.useState<string>("ALL")', "const [statusFilter, setStatusFilter] = React.useState<string[]>([])\n" + multiSelectComponent);
content = content.replace('const [projectFilter, setProjectFilter] = React.useState<string>("ALL")', 'const [projectFilter, setProjectFilter] = React.useState<string[]>([])');
content = content.replace('const [downloadStatusFilter, setDownloadStatusFilter] = React.useState<string>("ALL")', 'const [downloadStatusFilter, setDownloadStatusFilter] = React.useState<string[]>([])');

const filterLogic = `
    if (projectFilter.length > 0 && !projectFilter.includes(a.project.id)) return false;

    if (statusFilter.length > 0) {
      const isWorking = a.status === "APPROVED" || a.status === "WORKING" || a.status === "ACCEPTED" || a.status === "UNDER_REVIEW";
      const isCompleted = a.status === "COMPLETED" || a.status === "FINAL_REVIEW" || a.status === "PAID";
      const isNotStarted = isWorking && (!a.recordedCount || a.recordedCount === 0);
      const isActuallyWorking = isWorking && (a.recordedCount || 0) > 0;
      
      let matchesStatus = false;
      if (statusFilter.includes("PENDING") && a.status === "PENDING") matchesStatus = true;
      if (statusFilter.includes("WORKING") && isActuallyWorking) matchesStatus = true;
      if (statusFilter.includes("NOT_STARTED") && isNotStarted) matchesStatus = true;
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
`;

content = content.replace(/if \(projectFilter !== "ALL".*?return true;/s, filterLogic + "\n    return true;");

const statsLogic = `
  const stats = React.useMemo(() => {
    const s = {
      all: { m: 0, f: 0, total: 0 },
      pending: { m: 0, f: 0, total: 0 },
      working: { m: 0, f: 0, total: 0 },
      notStarted: { m: 0, f: 0, total: 0 },
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

      if (a.status === "PENDING") {
        s.pending.total++
        if (isMale) s.pending.m++
        if (isFemale) s.pending.f++
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
`;

content = content.replace(/const stats = React\.useMemo\(\(\) => \{.*?return s\n  \}, \[applications, projectFilter\]\)/s, statsLogic.trim());

const uiHtml = `
        <MultiSelectDropdown 
          label="Applicant Acceptance Status"
          allLabel={\`All Applicants (\${stats.all.total}) - M: \${stats.all.m} | F: \${stats.all.f}\`}
          options={[
            { value: "PENDING", label: \`Pending (\${stats.pending.total}) - M: \${stats.pending.m} | F: \${stats.pending.f}\` },
            { value: "WORKING", label: \`Working (\${stats.working.total}) - M: \${stats.working.m} | F: \${stats.working.f}\` },
            { value: "NOT_STARTED", label: \`Not Started (\${stats.notStarted.total}) - M: \${stats.notStarted.m} | F: \${stats.notStarted.f}\` },
            { value: "COMPLETED", label: \`Completed (\${stats.completed.total}) - M: \${stats.completed.m} | F: \${stats.completed.f}\` },
            { value: "REJECTED", label: \`Rejected (\${stats.rejected.total}) - M: \${stats.rejected.m} | F: \${stats.rejected.f}\` }
          ]}
          selectedValues={statusFilter}
          onChange={setStatusFilter}
        />

        <MultiSelectDropdown 
          label="Project Name"
          allLabel="All Projects"
          options={uniqueProjects.map(p => ({ label: p.title, value: p.id }))}
          selectedValues={projectFilter}
          onChange={setProjectFilter}
        />

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
`;

content = content.replace(/<div className="space-y-1\.5">\s*<label className="text-xs font-bold text-foreground\/60 uppercase">Applicant Acceptance Status.*?<\/select>\s*<\/div>\s*<\/div>/s, uiHtml.trim() + "\n      </div>");

fs.writeFileSync('src/app/(dashboard)/admin/applications/AdminApplicationsClient.tsx', content);
console.log("Replacement complete");
