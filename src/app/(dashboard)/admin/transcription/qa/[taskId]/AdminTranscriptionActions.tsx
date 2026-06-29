"use client"

import * as React from "react"
import { Edit2, Plus, UploadCloud, Loader2, X } from "lucide-react"
import { editTranscriptionTask, addTranscriptionTask } from "@/app/actions/transcriptionTasks"
import { useRouter } from "next/navigation"

export function AdminTranscriptionActions({ taskId, projectId, currentAudioUrl, currentSpeakerCount, currentStatus }: {
  taskId: string
  projectId: string
  currentAudioUrl: string
  currentSpeakerCount: number
  currentStatus: string
}) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Edit State
  const [audioUrl, setAudioUrl] = React.useState(currentAudioUrl)
  const [speakerCount, setSpeakerCount] = React.useState(currentSpeakerCount)
  const [status, setStatus] = React.useState(currentStatus)

  // Add State
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState("")

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await editTranscriptionTask(taskId, { audioFilePath: audioUrl, speakerCount, status })
    setIsSubmitting(false)
    if (res.success) {
      setShowEditModal(false)
      alert("Task updated successfully")
      router.refresh()
    } else {
      alert("Error: " + res.error)
    }
  }

  const handleAddAudio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadStatus("Starting upload...")
    
    try {
      const file = (e.currentTarget.elements.namedItem("audioFile") as HTMLInputElement).files?.[0]
      if (!file) throw new Error("No file selected")

      // 1. Get Signature
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" })
      if (!signRes.ok) throw new Error("Signature failed")
      const { timestamp, signature, folder, apiKey, cloudName } = await signRes.json()

      // 2. Upload to Cloudinary
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, true)
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url)
          else reject(new Error("Upload failed"))
        }
        xhr.onerror = () => reject(new Error("Network error"))

        const data = new FormData()
        data.append("file", file)
        data.append("api_key", apiKey)
        data.append("timestamp", timestamp.toString())
        data.append("signature", signature)
        data.append("folder", folder)
        xhr.send(data)
      })

      // Get duration
      setUploadStatus("Saving task...")
      const audio = new Audio(url)
      await new Promise((resolve) => {
        audio.addEventListener("loadedmetadata", resolve)
        audio.addEventListener("error", resolve) // fallback
      })
      const durationSeconds = Math.round(audio.duration || 0)

      const res = await addTranscriptionTask(projectId, url, durationSeconds)
      if (res.success) {
        setShowAddModal(false)
        alert("Audio added successfully as a new task in this project!")
      } else {
        alert("Error: " + res.error)
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
      setUploadStatus("")
      setUploadProgress(0)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all">
        <Edit2 className="w-4 h-4" /> تحرير التاسك
      </button>
      
      <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 font-bold rounded-xl hover:bg-green-500/20 transition-all">
        <Plus className="w-4 h-4" /> اضافة مقاطع صوتية
      </button>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Task Details</h3>
              <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-foreground/50 hover:text-foreground" /></button>
            </div>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Audio File URL</label>
                <input type="text" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Speaker Count</label>
                <input type="number" value={speakerCount} onChange={e => setSpeakerCount(parseInt(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none" required min="1" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Task Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none">
                  <option value="PENDING">PENDING</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 mt-4 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Audio Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Audio to Project</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-foreground/50 hover:text-foreground" /></button>
            </div>
            <form onSubmit={handleAddAudio} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Select Audio/Video File</label>
                <input type="file" name="audioFile" accept="audio/*,video/*" className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none" required />
              </div>
              
              {isSubmitting && (
                <div className="space-y-2 text-sm font-semibold">
                  <div className="flex justify-between text-primary">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-primary/10 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
              
              <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                Upload and Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
