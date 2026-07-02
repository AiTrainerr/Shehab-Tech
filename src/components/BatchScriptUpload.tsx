"use client"

import * as React from "react"
import { UploadCloud, Loader2, CheckCircle, X, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react"
import Papa from "papaparse"
import { uploadBatchScripts } from "@/app/actions/projects"
import { useRouter } from "next/navigation"

type ParsedFile = {
  file: File
  speakerCode: string
  rows: any[]
  error?: string
  uploaded?: boolean
}

export function BatchScriptUpload({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [parsedFiles, setParsedFiles] = React.useState<ParsedFile[]>([])
  const [isUploadingAll, setIsUploadingAll] = React.useState(false)
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)
  const [globalSuccess, setGlobalSuccess] = React.useState("")
  const [globalError, setGlobalError] = React.useState("")

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setGlobalSuccess("")
    setGlobalError("")

    const results: ParsedFile[] = []
    let pending = files.length

    files.forEach((file) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data as any[]
          const mapped = data.map((row: any) => {
            const keys = Object.keys(row)
            return {
              speakerCode: row["Speaker ID"] || row["录音人id"] || row[keys[0]] || "",
              audioId:     row["Audio ID"]   || row["音频id"]   || row[keys[1]] || "",
              text:        row["Text"]       || row["Script"]   || row["录音文本"] || row[keys[2]] || "",
              speed:       row["Speed"]      || row["语速"]     || row[keys[3]] || "正常"
            }
          }).filter(item => item.speakerCode && item.text)

          // Detect speakerCode from first row or from filename (strip extension)
          const detectedSpeakerCode = mapped[0]?.speakerCode || file.name.replace(/\.[^/.]+$/, "")

          results.push({
            file,
            speakerCode: detectedSpeakerCode,
            rows: mapped,
            error: mapped.length === 0 ? "Could not parse rows. Check column headers." : undefined
          })

          pending--
          if (pending === 0) {
            // Sort by speakerCode
            results.sort((a, b) => a.speakerCode.localeCompare(b.speakerCode))
            setParsedFiles(results)
            setExpandedIndex(0)
          }
        },
        error: (err: any) => {
          results.push({ file, speakerCode: file.name, rows: [], error: err.message })
          pending--
          if (pending === 0) {
            setParsedFiles(results)
          }
        }
      })
    })
  }

  const removeFile = (idx: number) => {
    setParsedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUploadAll = async () => {
    const toUpload = parsedFiles.filter(f => !f.error && !f.uploaded && f.rows.length > 0)
    if (toUpload.length === 0) return

    setIsUploadingAll(true)
    setGlobalError("")
    let uploadedCount = 0

    for (const pf of toUpload) {
      const res = await uploadBatchScripts(projectId, pf.rows)
      if (res.success) {
        setParsedFiles(prev => prev.map(f => f.file === pf.file ? { ...f, uploaded: true } : f))
        uploadedCount++
      } else {
        setParsedFiles(prev => prev.map(f => f.file === pf.file ? { ...f, error: res.error || "Upload failed" } : f))
      }
    }

    setIsUploadingAll(false)
    if (uploadedCount > 0) {
      setGlobalSuccess(`✅ تم رفع ${uploadedCount} ملف بنجاح! إجمالي ${parsedFiles.reduce((a, f) => a + f.rows.length, 0)} جملة محفوظة.`)
      router.refresh()
    }
  }

  const totalRows = parsedFiles.reduce((a, f) => a + f.rows.length, 0)
  const validFiles = parsedFiles.filter(f => !f.error && f.rows.length > 0)
  const uploadedFiles = parsedFiles.filter(f => f.uploaded)

  return (
    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-xl font-black flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-primary" /> رفع ملفات المتقدمين (Batch CSV)
        </h3>
        <p className="text-sm text-foreground/70 mt-1">
          ارفع جميع ملفاتك دفعةً واحدة. كل ملف = متقدم واحد (Speaker ID).
          عند الموافقة على أي متقدم، يُخصَّص له كوده تلقائياً.
        </p>
        <p className="text-xs text-foreground/50 mt-1">
          <b>أعمدة CSV المطلوبة:</b> Speaker ID (录音人id) — Audio ID (音频id) — Text (录音文本) — Speed (语速)
        </p>
      </div>

      {/* File picker - supports multiple */}
      <div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all bg-background/50">
          <UploadCloud className="w-8 h-8 text-primary/40 mb-2" />
          <p className="text-sm font-bold text-foreground/60">اسحب الملفات هنا أو اضغط للاختيار</p>
          <p className="text-xs text-foreground/40 mt-1">يدعم اختيار ملفات متعددة في آن واحد (.csv)</p>
          <input
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleFilesChange}
          />
        </label>
      </div>

      {/* Files List */}
      {parsedFiles.length > 0 && (
        <div className="space-y-3">
          {/* Summary bar */}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-foreground/60">
              {parsedFiles.length} ملف — {totalRows} جملة إجمالاً
            </span>
            <span className="text-green-500">{uploadedFiles.length} / {validFiles.length} تم رفعه</span>
          </div>

          {/* File cards */}
          {parsedFiles.map((pf, idx) => (
            <div key={idx} className={`border rounded-xl overflow-hidden transition-all ${
              pf.uploaded ? "border-green-500/30 bg-green-500/5" :
              pf.error    ? "border-red-500/30 bg-red-500/5" :
                            "border-border bg-card"
            }`}>
              {/* Card header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer select-none"
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              >
                <FileSpreadsheet className={`w-5 h-5 shrink-0 ${pf.error ? "text-red-500" : pf.uploaded ? "text-green-500" : "text-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">
                    {pf.speakerCode}
                    {pf.uploaded && <span className="ml-2 text-green-500 text-xs">✓ تم الرفع</span>}
                    {pf.error    && <span className="ml-2 text-red-500 text-xs">✗ خطأ</span>}
                  </p>
                  <p className="text-xs text-foreground/50">{pf.file.name} — {pf.rows.length} جملة</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {expandedIndex === idx ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
              </div>

              {/* Expanded preview */}
              {expandedIndex === idx && (
                <div className="border-t border-border">
                  {pf.error ? (
                    <p className="p-3 text-red-500 text-sm">{pf.error}</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 font-semibold">Speaker ID</th>
                            <th className="p-2 font-semibold">Audio ID</th>
                            <th className="p-2 font-semibold">Text</th>
                            <th className="p-2 font-semibold">Speed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pf.rows.slice(0, 8).map((r, i) => (
                            <tr key={i} className="hover:bg-muted/50">
                              <td className="p-2 font-mono">{r.speakerCode}</td>
                              <td className="p-2 font-mono">{r.audioId}</td>
                              <td className="p-2 max-w-[200px] truncate">{r.text}</td>
                              <td className="p-2">{r.speed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {pf.rows.length > 8 && (
                        <p className="text-xs text-foreground/40 text-center py-2">
                          ... وأكثر ({pf.rows.length - 8} صف إضافي)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Global messages */}
          {globalSuccess && (
            <div className="p-3 bg-green-500/10 text-green-600 rounded-xl text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {globalSuccess}
            </div>
          )}
          {globalError && (
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-sm font-semibold">{globalError}</div>
          )}

          {/* Upload all button */}
          {validFiles.filter(f => !f.uploaded).length > 0 && (
            <button
              disabled={isUploadingAll}
              onClick={handleUploadAll}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {isUploadingAll
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الرفع...</>
                : <><UploadCloud className="w-5 h-5" /> رفع {validFiles.filter(f => !f.uploaded).length} ملف ({totalRows} جملة)</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
