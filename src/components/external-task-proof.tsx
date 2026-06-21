"use client"

import * as React from "react"
import { CheckCircle, UploadCloud, FileImage, Loader2 } from "lucide-react"
import { uploadToSupabase } from "@/lib/storage"
import { submitApplicationProof } from "@/app/actions/projects"

export function ExternalTaskProofClient({ 
  applicationId, 
  proofUrl, 
  status 
}: { 
  applicationId: string, 
  proofUrl: string | null,
  status: string
}) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [showUploader, setShowUploader] = React.useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadToSupabase(file, 'proofs')
      const res = await submitApplicationProof(applicationId, url)
      
      if (!res.success) {
        alert("Error saving proof: " + res.error)
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (proofUrl) {
    return (
      <div className="mt-4 p-4 bg-background/50 rounded-xl border border-border">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground">Proof Submitted!</p>
            <p className="text-sm text-foreground/60 mb-3">You have uploaded your completion screenshot.</p>
            <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary text-sm hover:underline font-bold bg-primary/10 px-3 py-1.5 rounded-lg">
              <FileImage className="w-4 h-4" /> View Submitted Screenshot
            </a>
            
            {status === 'UNDER_REVIEW' && (
              <p className="text-xs text-yellow-500 mt-3 bg-yellow-500/10 px-2 py-1 rounded w-fit">
                Status: Waiting for Admin Review
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-5 bg-background/50 rounded-xl border border-border">
      <h4 className="font-bold mb-2">Have you finished the task?</h4>
      <p className="text-sm text-foreground/60 mb-4">
        If you have completely finished recording on the external platform, please upload a screenshot of your completed dashboard.
      </p>
      
      {!showUploader ? (
        <button 
          onClick={() => setShowUploader(true)}
          className="px-5 py-2.5 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors"
        >
          Yes, I finished!
        </button>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 bg-card hover:bg-background transition-colors">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="font-bold text-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-foreground/40 mb-2" />
                <p className="font-bold text-foreground">Click to upload screenshot</p>
                <p className="text-xs text-foreground/50 mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
