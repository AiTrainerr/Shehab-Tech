"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, X, Globe, UploadCloud, ChevronRight, FileText, Settings, CreditCard, PlayCircle, FileSpreadsheet, ChevronDown, ChevronUp, CheckCircle, Loader2, Eye } from "lucide-react"
import { createProjectAction, uploadBatchScripts } from "@/app/actions/projects"
import RichTextEditor from "@/components/RichTextEditor"
import { VoiceRecorderPreview } from "@/components/voice-recorder-preview"
import Papa from "papaparse"
import * as XLSX from "xlsx"

type ParsedFile = {
  file: File
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

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const STEPS = [
  { id: 1, title: "المعلومات الأساسية", icon: FileText },
  { id: 2, title: "رفع الجمل (السكربت)", icon: UploadCloud },
  { id: 3, title: "إعدادات الصوت والتسمية", icon: PlayCircle },
  { id: 4, title: "المتطلبات والتسعير", icon: CreditCard },
  { id: 5, title: "معاينة قبل النشر", icon: Eye },
];

export default function CreateRecordingProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Step 1 States
  const [description, setDescription] = React.useState("")
  const [privateData, setPrivateData] = React.useState("")
  const [langCount, setLangCount] = React.useState(1)
  const [imageCount, setImageCount] = React.useState(1)

  // Step 2 States
  const [hasScript, setHasScript] = React.useState(true)
  const [scriptType, setScriptType] = React.useState("STATIC")
  const [scriptMode, setScriptMode] = React.useState("file")
  const [fileName, setFileName] = React.useState("")

  // Batch Code file queue state
  const [batchFiles, setBatchFiles] = React.useState<ParsedFile[]>([])
  const [batchExpanded, setBatchExpanded] = React.useState<number | null>(null)

  // Step 3 States
  const [executionOption, setExecutionOption] = React.useState("INTERNAL")
  const [customNaming, setCustomNaming] = React.useState("")
  const [zipNamingRule, setZipNamingRule] = React.useState("FULL")

  // Step 4 States
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([])

  // Audio settings state (for preview)
  const [audioFormat, setAudioFormat] = React.useState("WAV")
  const [sampleRate, setSampleRate] = React.useState(44100)
  const [bitDepth, setBitDepth] = React.useState(16)
  const [channels, setChannels] = React.useState("MONO")
  const [minDuration, setMinDuration] = React.useState<number|null>(null)
  const [maxDuration, setMaxDuration] = React.useState<number|null>(null)
  const [enableNoiseCancellation, setEnableNoiseCancellation] = React.useState(false)
  const namingVariables = [
    { label: "كود المستقل (Speaker Code)", value: "[speakerCode]" },
    { label: "رقم الجملة (ID) من الشيت", value: "[audioId]" },
    { label: "الترتيب التلقائي (Order)", value: "[order]" },
    { label: "الجنس (Gender)", value: "[gender]" },
    { label: "العمر (Age)", value: "[age]" },
  ]
  const appendVariable = (val: string) => {
    setCustomNaming(prev => prev + (prev && !prev.endsWith('_') && !prev.endsWith('-') ? '-' : '') + val)
  }

  const addCountry = (country: string) => {
    if (!selectedCountries.includes(country)) setSelectedCountries(prev => [...prev, country])
  }
  const removeCountry = (country: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== country))
  }

  // Dynamic Preview Logic
  const previewSpeakerCode = "446"
  const previewAudioId = "001"
  let formattedAudioName = customNaming || "[speakerCode]_[order]"
  formattedAudioName = formattedAudioName
    .replace(/\[speakerCode\]/g, previewSpeakerCode)
    .replace(/\[audioId\]/g, previewAudioId)
    .replace(/\[gender\]/g, "Male")
    .replace(/\[age\]/g, "25")
    .replace(/\[order\]/g, "1")

  let formattedZipName = zipNamingRule || "FULL"
  if (formattedZipName === "FULL") formattedZipName = "[speakerCode]_[firstName]_[lastName]_[gender]_[age]"
  if (formattedZipName === "ANONYMOUS") formattedZipName = "[speakerCode]_[gender]_[age]"
  if (formattedZipName === "SPEAKER_ONLY") formattedZipName = "[speakerCode]"

  // Generate preview sentences
  const previewSentences = React.useMemo(() => {
    if (scriptType === "BATCH_CODE" && batchFiles.length > 0) {
      const firstValidFile = batchFiles.find(f => !f.error && f.rawData.length > 0)
      if (firstValidFile) {
        return firstValidFile.rawData.slice(0, 5).map((row, i) => ({
          id: `preview-${i}`,
          text: firstValidFile.textIdx !== -1 ? String(row[firstValidFile.textIdx] || "").trim() : "لا يوجد نص",
          order: i + 1,
          audioId: firstValidFile.audioIdx !== -1 ? String(row[firstValidFile.audioIdx] || String(row[firstValidFile.speakerIdx] || "")).trim() : `00${i+1}`,
          note: firstValidFile.noteIdx !== -1 ? String(row[firstValidFile.noteIdx] || "").trim() : undefined,
          speed: firstValidFile.speedIdx !== -1 ? String(row[firstValidFile.speedIdx] || "normal").trim() : "normal",
          recordings: []
        }))
      }
    }
    return [
      { id: "preview-1", text: "مرحباً بكم في منصتنا للتسجيل الصوتي.", order: 1, audioId: "S001", recordings: [] },
      { id: "preview-2", text: "هذه جملة تجريبية لمعاينة كيف سيظهر التطبيق للمستقل.", order: 2, audioId: "S002", speed: "بطيء", recordings: [] }
    ]
  }, [scriptType, batchFiles])

  formattedZipName = formattedZipName
    .replace(/\[speakerCode\]/g, previewSpeakerCode)
    .replace(/\[firstName\]/g, "Ali")
    .replace(/\[lastName\]/g, "Ahmed")
    .replace(/\[gender\]/g, "Male")
    .replace(/\[age\]/g, "25")

  const processRawData = (file: File, allRows: any[][]): ParsedFile => {
    if (allRows.length === 0) {
      return { file, headers: [], rawData: [], speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1, error: "الملف فارغ" }
    }
    const headers = (allRows[0] || []).map((h: any) => String(h || "").trim())
    const rawData = allRows.slice(1)
    let speakerIdx = 0, audioIdx = 0, textIdx = 1, noteIdx = -1, speedIdx = -1, orderIdx = -1
    headers.forEach((h: string, idx: number) => {
      const lower = h.toLowerCase()
      if (lower.includes('speaker') || lower.includes('كود') || lower.includes('录音人')) speakerIdx = idx
      else if (lower.includes('audio id') || lower.includes('صوت') || lower.includes('音频')) audioIdx = idx
      else if (lower === 'id' && audioIdx === 0) audioIdx = idx
      else if (lower.includes('text') || lower.includes('script') || lower.includes('نص') || lower.includes('文本')) textIdx = idx
      else if (lower.includes('note') || lower.includes('ملاحظ') || lower.includes('instruction')) noteIdx = idx
      else if (lower.includes('speed') || lower.includes('سرع') || lower.includes('语速')) speedIdx = idx
      else if (lower.includes('order') || lower.includes('رقم') || lower.includes('序号') || lower.includes('index')) orderIdx = idx
    })
    if (!headers.some(h => h.toLowerCase().includes('speaker') || h.toLowerCase().includes('كود')) && audioIdx !== 0) speakerIdx = audioIdx
    const colCount = headers.length
    if (speakerIdx === 0 && audioIdx === 0 && textIdx === 1 && noteIdx === -1 && speedIdx === -1) {
      if (colCount >= 5) { speakerIdx = 0; audioIdx = 1; textIdx = 2; noteIdx = 3; speedIdx = 4 }
      else if (colCount === 4) { speakerIdx = 0; audioIdx = 1; textIdx = 2; noteIdx = 3 }
      else if (colCount === 3) { speakerIdx = 0; audioIdx = 0; textIdx = 1; noteIdx = 2 }
    }
    return { file, headers, rawData, speakerIdx, audioIdx, textIdx, speedIdx, noteIdx, orderIdx }
  }

  const handleBatchFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = ""
    const results: ParsedFile[] = []
    let pending = files.length
    const done = () => { pending--; if (pending === 0) { setBatchFiles(prev => [...prev, ...results]); setBatchExpanded(0) } }
    files.forEach(file => {
      const isExcel = file.name.match(/\.(xlsx|xls)$/i)
      if (isExcel) {
        const reader = new FileReader()
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            let rows: any[][] = []
            if (firstSheetName) {
              const ws = workbook.Sheets[firstSheetName]
              rows = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]).filter(r => r && r.length > 0)
            }
            results.push(processRawData(file, rows))
          } catch (err: any) { results.push({ file, headers: [], rawData: [], speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1, error: err.message }) }
          done()
        }
        reader.onerror = () => { results.push({ file, headers: [], rawData: [], speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1, error: 'فشل قراءة الملف' }); done() }
        reader.readAsArrayBuffer(file)
      } else {
        Papa.parse(file, {
          header: false, skipEmptyLines: true,
          complete: (r) => { results.push(processRawData(file, r.data as any[][])); done() },
          error: (err: any) => { results.push({ file, headers: [], rawData: [], speakerIdx: -1, audioIdx: -1, textIdx: -1, speedIdx: -1, noteIdx: -1, orderIdx: -1, error: err.message }); done() }
        })
      }
    })
  }

  const updateBatchMapping = (fileIndex: number, field: keyof ParsedFile, value: number) => {
    setBatchFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, [field]: value } : f))
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto w-full animate-slide-up">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">
              نشر مشروع تسجيل صوتي جديد
            </h1>
            <p className="text-foreground/70">قم بإعداد مشروعك بدقة وبخطوات بسيطة.</p>
          </div>
          <Link href="/admin/projects/create" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors bg-card px-4 py-2 rounded-xl border border-border">
            العودة <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isPassed = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                      : isPassed 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "bg-card text-foreground/50 border border-border hover:bg-muted"
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.id}. {step.title}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-border rotate-180 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>

        <form action={async (formData) => {
          setIsSubmitting(true)
          const res = await createProjectAction(formData)
          if (res.success) {
            // If BATCH_CODE and we have files queued, upload them before redirecting
            if (scriptType === "BATCH_CODE" && batchFiles.length > 0) {
              for (const pf of batchFiles) {
                if (pf.error || pf.rawData.length === 0) continue
                const mapped = pf.rawData.map(row => ({
                  speakerCode: pf.speakerIdx !== -1 ? String(row[pf.speakerIdx] || "").trim() : "",
                  audioId: pf.audioIdx !== -1 ? String(row[pf.audioIdx] || String(row[pf.speakerIdx] || "")).trim() : "",
                  text: pf.textIdx !== -1 ? String(row[pf.textIdx] || "").trim() : "",
                  note: pf.noteIdx !== -1 ? String(row[pf.noteIdx] || "").trim() : "",
                  speed: pf.speedIdx !== -1 ? String(row[pf.speedIdx] || "normal").trim() : "normal",
                  order: pf.orderIdx !== -1 ? parseInt(row[pf.orderIdx]) || undefined : undefined,
                })).filter(item => item.speakerCode && item.text)
                if (mapped.length > 0) await uploadBatchScripts(res.projectId!, mapped)
              }
            }
            router.push(`/admin/projects/edit/${res.projectId}`)
          } else {
            alert(res.error || "حدث خطأ ما")
            setIsSubmitting(false)
          }
        }} className="glass p-6 sm:p-8 rounded-3xl border border-border shadow-sm">
          
          <input type="hidden" name="isTranscriptionProject" value="false" />

          {/* ================= STEP 1 ================= */}
          <div className={currentStep === 1 ? "block space-y-8 animate-fade-in" : "hidden"}>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">المعلومات الأساسية</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">عنوان المشروع <span className="text-red-500">*</span></label>
                <input name="title" type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="مثال: تسجيل أصوات باللهجة الإماراتية" required={currentStep===1} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">الوصف العام <span className="text-red-500">*</span></label>
                <div className="min-h-[200px]">
                  <RichTextEditor name="description" value={description} onChange={setDescription} placeholder="اشرح طبيعة المشروع للمستقلين..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-500 flex items-center gap-2">تعليمات خاصة <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-xs">مخفية للعامة</span></label>
                <div className="min-h-[200px]">
                  <RichTextEditor name="privateData" value={privateData} onChange={setPrivateData} placeholder="تظهر فقط للمستقلين بعد قبولهم (روابط، كلمات مرور، تعليمات دقيقة)..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xl font-bold text-foreground">اللغات المطلوبة</h3>
                <button type="button" onClick={() => setLangCount(prev => prev + 1)} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> إضافة لغة
                </button>
              </div>
              <input type="hidden" name="langCount" value={langCount} />
              
              {Array.from({ length: langCount }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-xl bg-card/50 relative">
                  {i > 0 && (
                    <button type="button" onClick={() => setLangCount(prev => prev - 1)} className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">اللغة</label>
                    <input name={`language_${i}`} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="مثال: Arabic" required={currentStep===1} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">اللهجة (اختياري)</label>
                    <input name={`dialect_${i}`} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="مثال: Emirati" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">المستوى</label>
                    <select name={`proficiency_${i}`} className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" required={currentStep===1}>
                      <option value="Native">لغة أم (Native)</option>
                      <option value="Near Native">ممتاز (Near Native)</option>
                      <option value="Beginner">مبتدئ (Beginner)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xl font-bold text-foreground">الصور التوضيحية</h3>
                <button type="button" onClick={() => setImageCount(prev => prev + 1)} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> إضافة صورة
                </button>
              </div>
              <input type="hidden" name="imageCount" value={imageCount} />
              {Array.from({ length: imageCount }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-card/50 relative">
                  {i > 0 && (
                    <button type="button" onClick={() => setImageCount(prev => prev - 1)} className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">الصورة</label>
                    <input name={`image_${i}`} type="file" accept="image/*" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">وصف / تعليق</label>
                    <input name={`caption_${i}`} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="اشرح ما بداخل الصورة..." />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= STEP 2 ================= */}
          <div className={currentStep === 2 ? "block space-y-8 animate-fade-in" : "hidden"}>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">إعدادات السكربت (الجمل)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">هل يتطلب المشروع قراءة جمل؟</label>
                  <select name="hasScript" value={hasScript.toString()} onChange={(e) => setHasScript(e.target.value === "true")} className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none">
                    <option value="true">نعم (سيتم رفع ملف)</option>
                    <option value="false">لا (تسجيل حر)</option>
                  </select>
                </div>

                {hasScript && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">طريقة توزيع الجمل</label>
                    <select name="scriptType" value={scriptType} onChange={(e) => setScriptType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none">
                      <option value="STATIC">نفس الجمل للجميع (Static)</option>
                      <option value="DYNAMIC_POOL">توزيع عشوائي من حصيلة (Dynamic Pool)</option>
                      <option value="PRE_ASSIGNED">مخصصة مسبقاً لكل شخص بالإيميل (Pre-Assigned)</option>
                      <option value="BATCH_CODE">أكواد غير متكررة (Batch Code)</option>
                    </select>
                  </div>
                )}
              </div>

              {hasScript && scriptType === "DYNAMIC_POOL" && (
                <div className="space-y-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <label className="text-sm font-semibold text-primary">حصة كل مستقل (عدد الجمل)</label>
                  <input name="sentencesPerUser" type="number" min="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none mt-2" placeholder="مثال: 50" required={currentStep===2 && scriptType==="DYNAMIC_POOL"} />
                </div>
              )}

              {hasScript && scriptType !== "BATCH_CODE" && (
                <div className="space-y-6 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">طريقة إدخال الجمل</label>
                    <select value={scriptMode} onChange={(e) => setScriptMode(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none">
                      <option value="file">رفع ملف إكسيل / الشيت (ينصح به)</option>
                      <option value="manual">إدخال يدوي</option>
                    </select>
                    <input type="hidden" name="scriptMode" value={scriptMode} />
                  </div>

                  {scriptMode === "file" ? (
                    <div className="space-y-6">
                      <div className="relative border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors rounded-2xl p-8 text-center cursor-pointer group">
                        <input 
                          name="scriptFile" 
                          type="file" 
                          accept={scriptType === "PRE_ASSIGNED" ? ".xlsx,.xls" : ".xlsx,.xls,.csv"} 
                          required={currentStep===2 && scriptMode==="file"}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                        />
                        <UploadCloud className="w-12 h-12 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-lg text-primary">{fileName ? fileName : "اسحب ملف الإكسيل هنا أو اضغط للاختيار"}</h4>
                        <p className="text-sm text-foreground/60 mt-1">صيغ مدعومة: XLSX, CSV</p>
                      </div>

                      {/* Column Mapping Options */}
                      <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                        <h4 className="font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> تعيين أعمدة الشيت (Column Mapping)</h4>
                        <p className="text-sm text-foreground/60">اكتب الحرف الإنجليزي للعمود (A, B, C...). أتركه فارغاً إذا لم يكن موجوداً.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">عمود نص الجملة <span className="text-red-500">*</span></label>
                            <input name="sentenceCol" type="text" placeholder="مثال: A" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">عمود المعرف (رقم الجملة)</label>
                            <input name="idCol" type="text" placeholder="مثال: B" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">عمود الملاحظات</label>
                            <input name="noteCol" type="text" placeholder="مثال: C" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">أدخل الجمل (جملة في كل سطر)</label>
                      <textarea name="manualScriptText" className="w-full h-48 px-4 py-3 rounded-xl bg-background border border-border outline-none resize-none" placeholder="الجملة الأولى..." required={currentStep===2 && scriptMode==="manual"} />
                      </div>
                    )}
                  </div>
                )}
                
                {hasScript && scriptType === "BATCH_CODE" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">رفع شيتات الأكواد (يمكن رفع عدة ملفات)</label>
                    <span className="text-xs text-foreground/50">{batchFiles.length} ملف — {batchFiles.reduce((a,f)=>a+f.rawData.length,0)} جملة</span>
                  </div>

                  {/* Drop zone */}
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-background hover:bg-primary/5 transition-colors">
                    <UploadCloud className="w-7 h-7 text-primary mb-1" />
                    <p className="text-sm font-semibold text-foreground">اسحب الملفات هنا أو اضغط للاختيار</p>
                    <p className="text-xs text-foreground/50 mt-0.5">XLSX, CSV — يمكنك اختيار عدة ملفات معاً</p>
                    <input type="file" accept=".csv,.xlsx,.xls" multiple className="hidden" onChange={handleBatchFilesChange} />
                  </label>

                  {/* File cards */}
                  {batchFiles.length > 0 && (
                    <div className="space-y-2">
                      {batchFiles.map((pf, idx) => {
                        const isExpanded = batchExpanded === idx
                        return (
                          <div key={idx} className={`border rounded-xl overflow-hidden ${ pf.error ? "border-red-500/30 bg-red-500/5" : "border-border bg-card" }`}>
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-foreground/5" onClick={() => setBatchExpanded(isExpanded ? null : idx)}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileSpreadsheet className={`w-4 h-4 flex-shrink-0 ${pf.error ? "text-red-500" : "text-primary"}`} />
                                <div className="truncate">
                                  <p className="text-sm font-bold truncate" dir="ltr">{pf.file.name}</p>
                                  {pf.error ? <p className="text-xs text-red-500">{pf.error}</p> : <p className="text-xs text-foreground/60">{pf.rawData.length} جملة</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={e => { e.stopPropagation(); setBatchFiles(prev => prev.filter((_,i)=>i!==idx)) }} className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
                              </div>
                            </div>
                            {isExpanded && !pf.error && (
                              <div className="p-3 border-t border-border bg-background/50 grid grid-cols-2 md:grid-cols-3 gap-3">
                                <p className="col-span-full text-xs font-bold text-primary">عيّن الأعمدة بشكل صحيح:</p>
                                {[
                                  { label: "كود المستقل *", field: "speakerIdx" as keyof ParsedFile, noneLabel: "-- غير محدد --" },
                                  { label: "رقم الجملة (Audio ID)", field: "audioIdx" as keyof ParsedFile, noneLabel: "-- نفس الكود --" },
                                  { label: "النص *", field: "textIdx" as keyof ParsedFile, noneLabel: "-- غير محدد --" },
                                  { label: "السرعة", field: "speedIdx" as keyof ParsedFile, noneLabel: "-- افتراضي --" },
                                  { label: "ملاحظة", field: "noteIdx" as keyof ParsedFile, noneLabel: "-- بدون --" },
                                  { label: "ترتيب", field: "orderIdx" as keyof ParsedFile, noneLabel: "-- تلقائي --" },
                                ].map(({ label, field, noneLabel }) => (
                                  <div key={field} className="space-y-1">
                                    <label className="text-xs font-semibold">{label}</label>
                                    <select value={pf[field] as number} onChange={e => updateBatchMapping(idx, field, parseInt(e.target.value))} className="w-full text-xs p-2 rounded-lg border border-border bg-card outline-none focus:border-primary">
                                      <option value={-1}>{noneLabel}</option>
                                      {pf.headers.map((h, i) => <option key={i} value={i}>العمود {i+1}: {h || `(${i+1})`}</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* ================= STEP 3 ================= */}
          <div className={currentStep === 3 ? "block space-y-8 animate-fade-in" : "hidden"}>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">إعدادات الصوت وتسمية الملفات</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">مكان التنفيذ</label>
                  <select name="executionOption" value={executionOption} onChange={e => setExecutionOption(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none">
                    <option value="INTERNAL">داخل المنصة (نظام التسجيل المدمج)</option>
                    <option value="EXTERNAL">منصة خارجية (يتم تحويل المستقل لرابط خارجي)</option>
                  </select>
                </div>
                {executionOption === "EXTERNAL" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">رابط المنصة الخارجية <span className="text-red-500">*</span></label>
                    <input name="externalUrl" type="url" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="https://" required={currentStep===3 && executionOption==="EXTERNAL"} />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">تسمية المجلد (ZIP) عند التنزيل</label>
                  <p className="text-xs text-foreground/70 mb-2">اضغط على المتغيرات لإضافتها، أو اكتب نصوصاً ثابتة مباشرة في الحقل.</p>
                  
                  <input 
                    type="text" 
                    name="zipNamingRule" 
                    value={zipNamingRule === "FULL" ? "[speakerCode]_[firstName]_[lastName]_[gender]_[age]" : zipNamingRule === "ANONYMOUS" ? "[speakerCode]_[gender]_[age]" : zipNamingRule === "SPEAKER_ONLY" ? "[speakerCode]" : zipNamingRule}
                    onChange={(e) => setZipNamingRule(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm text-left" 
                    placeholder="[speakerCode]_[firstName]" 
                    dir="ltr"
                  />
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { label: "كود المستقل", value: "[speakerCode]" },
                      { label: "الاسم الأول", value: "[firstName]" },
                      { label: "اسم العائلة", value: "[lastName]" },
                      { label: "الجنس", value: "[gender]" },
                      { label: "العمر", value: "[age]" },
                    ].map(v => (
                      <button key={v.value} type="button" onClick={() => setZipNamingRule(prev => {
                        const current = prev === "FULL" ? "[speakerCode]_[firstName]_[lastName]_[gender]_[age]" : prev === "ANONYMOUS" ? "[speakerCode]_[gender]_[age]" : prev === "SPEAKER_ONLY" ? "[speakerCode]" : prev;
                        return current + (current && !current.endsWith('_') && !current.endsWith('-') ? '_' : '') + v.value;
                      })} className="px-3 py-1.5 text-xs font-semibold bg-background border border-border rounded-lg hover:bg-primary/10 hover:border-primary/50 transition-colors">
                        {v.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => setZipNamingRule("")} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto">
                      مسح
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic File Naming Builder & Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                  <h4 className="font-bold text-lg">منشئ تسمية الملفات الصوتية</h4>
                  <p className="text-xs text-foreground/70">اضغط على المتغيرات لإضافتها لنمط التسمية. سيتم تطبيق هذا النمط على كل ملف صوتي داخل الـ ZIP. يمكنك أيضاً كتابة نصوص ثابتة يدوياً.</p>
                  
                  <input 
                    type="text" 
                    name="customFileNaming" 
                    value={customNaming}
                    onChange={(e) => setCustomNaming(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm text-left" 
                    placeholder="[audioId]-[speakerCode]" 
                    dir="ltr"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {namingVariables.map(v => (
                      <button key={v.value} type="button" onClick={() => appendVariable(v.value)} className="px-3 py-1.5 text-xs font-semibold bg-background border border-border rounded-lg hover:bg-primary/10 hover:border-primary/50 transition-colors">
                        {v.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => setCustomNaming("")} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto">
                      مسح
                    </button>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <h4 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" /> معاينة التسمية
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-foreground/60 mb-1 font-semibold">اسم المجلد (Folder):</p>
                      <div className="p-3 bg-background rounded-xl border border-border font-mono text-sm text-left" dir="ltr">
                        {formattedZipName}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-foreground/60 mb-1 font-semibold">اسم الملف الصوتي (File):</p>
                      <div className="p-3 bg-background rounded-xl border border-primary/30 font-mono text-sm font-bold text-primary text-left shadow-sm" dir="ltr">
                        {formattedAudioName}.wav
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-6">
                <h4 className="font-bold text-lg mb-4 text-foreground">إعدادات الصوت المتقدمة</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-card rounded-2xl border border-border">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">الصيغة</label>
                      <select name="audioFormat" defaultValue="WAV" className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none text-sm">
                        <option value="WAV">WAV (Lossless)</option>
                        <option value="FLAC">FLAC</option>
                        <option value="MP3">MP3</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">معدل النقل (Sample Rate)</label>
                      <select name="sampleRate" defaultValue="44100" className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none text-sm">
                        <option value="16000">16000 Hz</option>
                        <option value="44100">44100 Hz</option>
                        <option value="48000">48000 Hz</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">العمق (Bit Depth)</label>
                      <select name="bitDepth" defaultValue="16" className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none text-sm">
                        <option value="16">16-bit</option>
                        <option value="24">24-bit</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">القنوات</label>
                      <select name="channels" defaultValue="MONO" className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none text-sm">
                        <option value="MONO">Mono (1 Channel)</option>
                        <option value="STEREO">Stereo</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">إلغاء الضوضاء بالمتصفح؟</label>
                      <select name="enableNoiseCancellation" defaultValue="false" className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none text-sm">
                        <option value="false">لا (صوت خام - ينصح به)</option>
                        <option value="true">نعم</option>
                      </select>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          {/* ================= STEP 4 ================= */}
          <div className={currentStep === 4 ? "block space-y-8 animate-fade-in" : "hidden"}>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">المتطلبات الإضافية والتسعير</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> الدول المستهدفة <span className="text-foreground/40 font-normal">(اتركه فارغاً لجميع الدول)</span></label>
                  <input type="hidden" name="reqCountry" value={selectedCountries.length > 0 ? JSON.stringify(selectedCountries) : ""} />
                  
                  {selectedCountries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCountries.map(c => (
                        <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-semibold">
                          {c}
                          <button type="button" onClick={() => removeCountry(c)} className="hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                      <button type="button" onClick={() => setSelectedCountries([])} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-500 font-bold rounded-full border border-red-400/20 hover:bg-red-500/10 transition-colors">مسح الكل</button>
                    </div>
                  )}
                  <select value="" onChange={e => { if (e.target.value) addCountry(e.target.value) }} className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none appearance-none cursor-pointer">
                    <option value="">— اختر دولة لإضافتها —</option>
                    {COUNTRIES.filter(c => !selectedCountries.includes(c)).map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold">سعر المشروع ($)</label>
                  <div className="flex gap-2">
                    <input name="price" type="number" step="0.01" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="مثال: 50.00" required={currentStep===4} />
                    <select name="pricingModel" defaultValue="FIXED_PROJECT" className="w-32 px-2 py-3 rounded-xl bg-background border border-border outline-none text-sm">
                      <option value="FIXED_PROJECT">مشروع ثابت</option>
                      <option value="PER_HOUR">بالساعة</option>
                      <option value="PER_SENTENCE">بالجملة</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">حجم التسجيل (المدة/العدد)</label>
                  <div className="flex gap-2">
                    <input name="recordingDuration" type="number" step="0.1" min="0.1" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="مثال: 2.5 أو 500" />
                    <select name="durationUnit" defaultValue="HOUR" className="w-32 px-2 py-3 rounded-xl bg-background border border-border outline-none text-sm">
                      <option value="HOUR">ساعات</option>
                      <option value="SENTENCE">جمل</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">الحد الأدنى والأقصى للعمر (اختياري)</label>
                  <div className="flex gap-2 items-center">
                    <input name="reqAgeMin" type="number" min="18" max="80" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="الحد الأدنى" />
                    <span>-</span>
                    <input name="reqAgeMax" type="number" min="18" max="80" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="الحد الأقصى" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">عدد المستقلين المطلوب (العدد الإجمالي)</label>
                  <input name="requiredParticipants" type="number" min="1" defaultValue="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="مثال: 50" required={currentStep===4} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">عدد الذكور والإناث المطلوبين (اختياري)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-blue-400">👨 ذكور</label>
                      <input name="targetMales" type="number" min="0" defaultValue="0" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-pink-400">👩 إناث</label>
                      <input name="targetFemales" type="number" min="0" defaultValue="0" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="0" />
                    </div>
                  </div>
                  <p className="text-xs text-foreground/50 mt-1">يجب أن يكون المجموع أقل من أو يساوي العدد الإجمالي. اتركهم 0 إذا لم يكن هناك تحديد للجنس.</p>
                </div>


                <div className="space-y-2">
                  <label className="text-sm font-semibold">مهلة التسجيل (بالساعات)</label>
                  <input name="timeLimitHours" type="number" min="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="مثال: 24 ساعة" />
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <label className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                  <input name="autoApprove" type="checkbox" value="true" className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                  <div>
                    <p className="font-bold text-sm text-foreground">قبول تلقائي للمتقدمين (Auto-Approve)</p>
                    <p className="text-xs text-foreground/60">اذا قمت بتفعيله، سيتم قبول أي شخص يتقدم للمشروع فوراً.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ================= STEP 5 ================= */}
          <div className={currentStep === 5 ? "block space-y-8 animate-fade-in" : "hidden"}>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">معاينة شاشة المستقل (Preview)</h3>
              <p className="text-sm text-foreground/70">هكذا ستظهر شاشة التسجيل للمستقل. يمكنك اختبار واجهة المستخدم ومراجعة كيفية عرض الجمل والإرشادات. الملفات التي تسجلها هنا للمعاينة فقط ولن يتم حفظها.</p>
              
              <div className="bg-card p-6 rounded-2xl border border-border mt-4 pointer-events-auto">
                <VoiceRecorderPreview 
                  projectId="preview-project"
                  speakerCode={scriptType === "PRE_ASSIGNED" || scriptType === "BATCH_CODE" ? "PREVIEW-CODE" : undefined}
                  applicationStatus="APPROVED"
                  audioFormat={audioFormat}
                  sampleRate={sampleRate}
                  bitDepth={bitDepth}
                  channels={channels}
                  minDuration={minDuration}
                  maxDuration={maxDuration}
                  enableNoiseCancellation={enableNoiseCancellation}
                  sentences={previewSentences}
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center pt-8 mt-8 border-t border-border">
            {currentStep > 1 ? (
              <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-3 rounded-xl font-bold text-foreground/70 hover:bg-card border border-border transition-colors">
                السابق
              </button>
            ) : <div></div>}
            
            {currentStep < 5 ? (
              <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                التالي
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 hover:-translate-y-0.5 disabled:opacity-50">
                <Save className="w-5 h-5" /> {isSubmitting ? "جاري النشر..." : "نشر المشروع"}
              </button>
            )}
          </div>
          
        </form>
      </div>
    </div>
  )
}
