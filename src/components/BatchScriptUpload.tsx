"use client"

import * as React from "react"
import { UploadCloud, Loader2, FileText, CheckCircle } from "lucide-react"
import Papa from "papaparse"
import { uploadBatchScripts } from "@/app/actions/projects"
import { useRouter } from "next/navigation"

export function BatchScriptUpload({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<any[]>([])
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setError("")
    setSuccess(false)
    setPreview([])

    Papa.parse(selected, {
      header: true, // expects first row to be headers
      skipEmptyLines: true,
      complete: (results) => {
        // We expect headers similar to: Speaker ID, Audio ID, Text, Speed
        const data = results.data as any[]
        if (data.length > 0) {
          // Normalize headers
          const mapped = data.map((row: any) => {
            const keys = Object.keys(row)
            return {
              speakerCode: row["Speaker ID"] || row["录音人id"] || row[keys[0]] || "",
              audioId: row["Audio ID"] || row["音频id"] || row[keys[1]] || "",
              text: row["Text"] || row["Script"] || row["录音文本"] || row[keys[2]] || "",
              speed: row["Speed"] || row["语速"] || row[keys[3]] || "正常"
            }
          }).filter(item => item.speakerCode && item.text)
          
          setPreview(mapped)
          
          if (mapped.length === 0) {
            setError("Could not parse valid columns. Ensure columns exist for: Speaker ID, Audio ID, Text, Speed.")
          }
        }
      },
      error: (err: any) => {
        setError(err.message)
      }
    })
  }

  const handleUpload = async () => {
    if (preview.length === 0) return
    setIsUploading(true)
    setError("")
    
    const res = await uploadBatchScripts(projectId, preview)
    setIsUploading(false)
    
    if (res.success) {
      setSuccess(true)
      setFile(null)
      setPreview([])
      router.refresh()
    } else {
      setError(res.error || "Failed to upload")
    }
  }

  return (
    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl space-y-4">
      <div>
        <h3 className="text-xl font-black flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-primary" /> Advanced Batch Assignment (CSV)
        </h3>
        <p className="text-sm text-foreground/70 mt-1">
          Upload a CSV file containing multiple scripts. Upon approval, each user will be automatically assigned one unique <b>Speaker ID</b> from this batch.
        </p>
        <p className="text-xs text-foreground/50 mt-1">
          <b>Expected Columns:</b> Speaker ID (录音人id), Audio ID (音频id), Script Text (录音文本), Speed (语速).
        </p>
      </div>

      <div className="space-y-4">
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
        />

        {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-sm font-semibold">{error}</div>}
        {success && <div className="p-3 bg-green-500/10 text-green-500 rounded-xl text-sm font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Successfully imported batch scripts!</div>}

        {preview.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">Preview ({preview.length} sentences found):</p>
            <div className="max-h-60 overflow-y-auto border border-border rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 font-semibold">Speaker ID</th>
                    <th className="p-2 font-semibold">Audio ID</th>
                    <th className="p-2 font-semibold">Text</th>
                    <th className="p-2 font-semibold">Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.slice(0, 10).map((p, i) => (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="p-2">{p.speakerCode}</td>
                      <td className="p-2">{p.audioId}</td>
                      <td className="p-2">{p.text}</td>
                      <td className="p-2">{p.speed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 10 && <p className="text-xs text-foreground/50 text-center">Showing first 10 rows...</p>}
            
            <button 
              disabled={isUploading}
              onClick={handleUpload}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              Upload & Save {preview.length} Sentences
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
