"use client"

import * as React from "react"
import { UploadCloud, Loader2, CheckCircle, X, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { uploadBatchScripts } from "@/app/actions/projects"
import { useRouter } from "next/navigation"

type ParsedFile = {
  file: File
  speakerCode: string
  headers: string[]
  rawData: any[][]
  
  speakerIdx: number
  audioIdx: number
  textIdx: number
  speedIdx: number
  noteIdx: number
  orderIdx: number

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
    e.target.value = ""

    const results: ParsedFile[] = []
    let pending = files.length

    const checkDone = () => {
      pending--
      if (pending === 0) {
        results.sort((a, b) => a.speakerCode.localeCompare(b.speakerCode))
        setParsedFiles(prev => [...prev, ...results])
        setExpandedIndex(prev => prev === null ? 0 : prev)
      }
    }

    const processRawData = (file: File, allRows: any[][]) => {
      if (allRows.length === 0) {
        results.push({
          file, speakerCode: file.name, headers: [], rawData: [],
          speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1,
          error: "الملف فارغ"
        })
        checkDone()
        return
      }

      // First row is headers
      const headersRow = allRows[0] || []
      const headers = headersRow.map((h: any) => String(h || "").trim())
      const rawData = allRows.slice(1) // exclude headers

      let speakerIdx = 0, audioIdx = 0, textIdx = 1, noteIdx = -1, speedIdx = -1, orderIdx = -1

      // Auto-guess columns
      headers.forEach((h: string, idx: number) => {
        const lower = h.toLowerCase()
        if (lower.includes('speaker') || lower.includes('كود') || lower.includes('录音人')) speakerIdx = idx;
        else if (lower.includes('audio id') || lower.includes('صوت') || lower.includes('音频')) audioIdx = idx;
        else if (lower === 'id' && audioIdx === 0) audioIdx = idx;
        else if (lower.includes('text') || lower.includes('script') || lower.includes('نص') || lower.includes('文本')) textIdx = idx;
        else if (lower.includes('note') || lower.includes('ملاحظ') || lower.includes('instruction')) noteIdx = idx;
        else if (lower.includes('speed') || lower.includes('سرع') || lower.includes('语速')) speedIdx = idx;
        else if (lower.includes('order') || lower.includes('رقم') || lower.includes('序号') || lower.includes('index')) orderIdx = idx;
      })

      if (!headers.some((c) => c.toLowerCase().includes('speaker') || c.toLowerCase().includes('كود')) && audioIdx !== 0) {
        speakerIdx = audioIdx;
      }

      const colCount = headers.length
      if (speakerIdx === 0 && audioIdx === 0 && textIdx === 1 && noteIdx === -1 && speedIdx === -1) {
        if (colCount >= 5) {
          speakerIdx = 0; audioIdx = 1; textIdx = 2; noteIdx = 3; speedIdx = 4;
        } else if (colCount === 4) {
          speakerIdx = 0; audioIdx = 1; textIdx = 2; noteIdx = 3; speedIdx = -1;
        } else if (colCount === 3) {
          speakerIdx = 0; audioIdx = 0; textIdx = 1; noteIdx = 2; speedIdx = -1;
        }
      }

      results.push({
        file,
        speakerCode: file.name.replace(/\.[^/.]+$/, ""),
        headers,
        rawData,
        speakerIdx,
        audioIdx,
        textIdx,
        speedIdx,
        noteIdx,
        orderIdx
      })
      checkDone()
    }

    files.forEach((file) => {
      const isExcel = file.name.match(/\.(xlsx|xls)$/i);
      if (isExcel) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            let allRows: any[][] = [];
            
            // Only process the first sheet to avoid header collision if sheets have different structures
            const firstSheetName = workbook.SheetNames[0]
            if (firstSheetName) {
               const worksheet = workbook.Sheets[firstSheetName];
               const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
               allRows = rows.filter(r => r && r.length > 0)
            }
            
            processRawData(file, allRows);
          } catch (err: any) {
            results.push({
              file, speakerCode: file.name, headers: [], rawData: [],
              speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1,
              error: "خطأ في قراءة الشيت: " + err.message
            })
            checkDone()
          }
        };
        reader.onerror = () => {
          results.push({
            file, speakerCode: file.name, headers: [], rawData: [],
            speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1,
            error: "فشل في قراءة الملف."
          })
          checkDone()
        }
        reader.readAsArrayBuffer(file);
      } else {
        // CSV
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (result) => {
            processRawData(file, result.data as any[][]);
          },
          error: (err: any) => {
            results.push({
              file, speakerCode: file.name, headers: [], rawData: [],
              speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1,
              error: err.message
            })
            checkDone()
          }
        })
      }
    })
  }

  const updateMapping = (fileIndex: number, field: keyof ParsedFile, value: number) => {
    setParsedFiles(prev => prev.map(f => ({ ...f, [field]: value })))
  }

  const removeFile = (idx: number) => {
    setParsedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUploadAll = async () => {
    const toUpload = parsedFiles.filter(f => !f.error && !f.uploaded && f.rawData.length > 0)
    if (toUpload.length === 0) return

    setIsUploadingAll(true)
    setGlobalError("")
    let uploadedCount = 0

    for (const pf of toUpload) {
      // Map rows based on selected indices
      const mapped = pf.rawData.map(row => {
        const parsedOrder = pf.orderIdx !== -1 ? parseInt(row[pf.orderIdx]) : NaN;
        
        // If speakerIdx is -1, OR if the row's speaker code is empty, use the file name as the speaker code
        const extractedSpeakerCode = pf.speakerIdx !== -1 ? String(row[pf.speakerIdx] || "").trim() : "";
        const mappedSpeakerCode = extractedSpeakerCode || pf.speakerCode;
        
        // If audioIdx is -1, leave it empty (which will fallback to sequential numbers in the UI)
        const mappedAudioId = pf.audioIdx !== -1 ? String(row[pf.audioIdx] || "").trim() : "";

        return {
          speakerCode: mappedSpeakerCode,
          audioId:     mappedAudioId,
          text:        pf.textIdx !== -1 ? String(row[pf.textIdx] || "").trim() : "",
          note:        pf.noteIdx !== -1 ? String(row[pf.noteIdx] || "").trim() : "",
          speed:       pf.speedIdx !== -1 ? String(row[pf.speedIdx] || "normal").trim() : "normal",
          order:       !isNaN(parsedOrder) ? parsedOrder : undefined
        }
      }).filter(item => item && item.speakerCode && item.text)

      if (mapped.length === 0) {
        setParsedFiles(prev => prev.map(f => f.file === pf.file ? { ...f, error: "تعذر استخراج الجمل. تأكد من تحديد أعمدة النص والكود بشكل صحيح." } : f))
        continue;
      }

      const res = await uploadBatchScripts(projectId, mapped)
      if (res.success) {
        setParsedFiles(prev => prev.map(f => f.file === pf.file ? { ...f, uploaded: true, error: undefined } : f))
        uploadedCount++
      } else {
        setParsedFiles(prev => prev.map(f => f.file === pf.file ? { ...f, error: res.error || "Upload failed" } : f))
      }
    }

    setIsUploadingAll(false)
    if (uploadedCount > 0) {
      setGlobalSuccess(`تم رفع ${uploadedCount} ملف بنجاح! تم إضافة جميع الجمل المطلوبة.`)
      router.refresh()
    }
  }

  const validFiles = parsedFiles.filter(f => !f.error)
  const uploadedFiles = validFiles.filter(f => f.uploaded)
  const totalRows = parsedFiles.reduce((a, f) => a + f.rawData.length, 0)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {globalSuccess && <div className="p-4 bg-green-500/10 text-green-500 rounded-xl font-bold">{globalSuccess}</div>}
      {globalError && <div className="p-4 bg-red-500/10 text-red-500 rounded-xl font-bold">{globalError}</div>}

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-background hover:bg-primary/5 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-semibold text-foreground">اختر شيتات Excel أو CSV</p>
            <p className="text-xs text-foreground/50 mt-1">يمكنك اختيار عدة ملفات معاً</p>
          </div>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            multiple
            className="hidden"
            onChange={handleFilesChange}
          />
        </label>
      </div>

      {parsedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-foreground/60">
              {parsedFiles.length} ملفات — {totalRows} جملة
            </span>
            <span className="text-green-500">{uploadedFiles.length} / {validFiles.length} تم رفعه</span>
          </div>

          {parsedFiles.map((pf, idx) => {
            const isExpanded = expandedIndex === idx
            return (
            <div key={idx} className={`border rounded-xl overflow-hidden transition-all ${
              pf.uploaded ? "border-green-500/30 bg-green-500/5" :
              pf.error    ? "border-red-500/30 bg-red-500/5" :
              "border-border bg-card"
            }`}>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5"
                onClick={() => !pf.uploaded && setExpandedIndex(isExpanded ? null : idx)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileSpreadsheet className={`w-5 h-5 flex-shrink-0 ${pf.uploaded ? "text-green-500" : pf.error ? "text-red-500" : "text-primary"}`} />
                  <div className="truncate">
                    <p className="font-bold text-sm truncate" dir="ltr">{pf.file.name}</p>
                    {pf.error ? (
                      <p className="text-xs text-red-500 truncate">{pf.error}</p>
                    ) : (
                      <p className="text-xs text-foreground/60">{pf.rawData.length} جملة</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {pf.uploaded && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {!pf.uploaded && (
                    <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {!pf.uploaded && !pf.error && (
                    isExpanded ? <ChevronUp className="w-5 h-5 text-foreground/40" /> : <ChevronDown className="w-5 h-5 text-foreground/40" />
                  )}
                </div>
              </div>

              {/* Column Mapper UI */}
              {isExpanded && !pf.uploaded && !pf.error && (
                <div className="p-4 border-t border-border bg-background/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-full">
                    <p className="text-xs font-bold text-primary mb-2">قم بتعيين الأعمدة بشكل صحيح بناءً على هذا الشيت:</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">كود المستقل (Speaker ID)</label>
                    <select value={pf.speakerIdx} onChange={e => updateMapping(idx, 'speakerIdx', parseInt(e.target.value))} className="w-full text-sm p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                      <option value={-1}>-- غير محدد --</option>
                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">رقم الجملة (Audio ID)</label>
                    <select value={pf.audioIdx} onChange={e => updateMapping(idx, 'audioIdx', parseInt(e.target.value))} className="w-full text-sm p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                      <option value={-1}>-- غير محدد --</option>
                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">النص (Text)</label>
                    <select value={pf.textIdx} onChange={e => updateMapping(idx, 'textIdx', parseInt(e.target.value))} className="w-full text-sm p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                      <option value={-1}>-- غير محدد --</option>
                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">السرعة (Speed)</label>
                    <select value={pf.speedIdx} onChange={e => updateMapping(idx, 'speedIdx', parseInt(e.target.value))} className="w-full text-sm p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                      <option value={-1}>-- افتراضي (عادي) --</option>
                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">ملاحظة (Note)</label>
                    <select value={pf.noteIdx} onChange={e => updateMapping(idx, 'noteIdx', parseInt(e.target.value))} className="w-full text-sm p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                      <option value={-1}>-- بدون ملاحظة --</option>
                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">ترتيب (Order)</label>
                    <select value={pf.orderIdx} onChange={e => updateMapping(idx, 'orderIdx', parseInt(e.target.value))} className="w-full text-sm p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                      <option value={-1}>-- تلقائي --</option>
                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )})}

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



