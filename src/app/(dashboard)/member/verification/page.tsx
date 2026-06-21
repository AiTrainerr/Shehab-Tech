"use client"

import * as React from "react"
import { Shield, Upload, Camera, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { compressImage } from "@/lib/image-compress"
import { submitVerification } from "@/app/actions/verification"

export default function MemberVerificationPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState("")
  const [previews, setPreviews] = React.useState<{ idCard: string | null, selfie: string | null }>({
    idCard: null,
    selfie: null
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'selfie') => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviews(prev => ({ ...prev, [type]: url }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    
    try {
      const form = e.currentTarget
      const formData = new FormData()
      formData.append("email", (form.elements.namedItem('email') as HTMLInputElement).value)
      
      const idCardFile = (form.elements.namedItem('idCard') as HTMLInputElement).files?.[0]
      const selfieFile = (form.elements.namedItem('selfie') as HTMLInputElement).files?.[0]
      
      if (!idCardFile || !selfieFile) {
        throw new Error("Please select both ID and Selfie images.")
      }

      // Compress images before upload to prevent server limits and speed up upload
      const compressedIdCard = await compressImage(idCardFile)
      const compressedSelfie = await compressImage(selfieFile)
      
      formData.append("idCard", compressedIdCard)
      formData.append("selfie", compressedSelfie)

      const result = await submitVerification(formData)
    
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "An error occurred")
      }
    } catch (err: any) {
      setError(err.message || "Failed to compress or upload images")
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full">
        
        <Link href="/member/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" /> 
            Verify Your Identity
          </h1>
          <p className="text-foreground/70 mt-2 text-lg">Upload your official documents to unlock premium projects and withdrawals.</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Shield className="w-64 h-64" />
          </div>

          {success ? (
            <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black mb-4">Verification Submitted!</h3>
              <p className="text-xl text-foreground/70 max-w-md mx-auto">
                We've received your documents. Our team will review them within 24-48 hours.
              </p>
              <Link href="/member/profile" className="inline-block mt-10 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Return to Profile
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative">
              {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-sm border border-red-500/20 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-foreground/60">Confirm Your Email</label>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="Enter your account email"
                  className="w-full px-5 py-4 rounded-2xl bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* ID Card */}
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 1. Upload ID Card
                  </label>
                  <div className={`relative group aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3 bg-background/30 ${previews.idCard ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                    {previews.idCard ? (
                      <>
                        <img src={previews.idCard} alt="ID Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-bold text-sm">Click to change</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold text-foreground/50">Front side of your ID</p>
                      </>
                    )}
                    <input 
                      name="idCard" 
                      type="file" 
                      accept="image/*" 
                      required 
                      onChange={(e) => handleFileChange(e, 'idCard')}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Selfie */}
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> 2. Take a Selfie
                  </label>
                  <div className={`relative group aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3 bg-background/30 ${previews.selfie ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                    {previews.selfie ? (
                      <>
                        <img src={previews.selfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-bold text-sm">Click to change</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                          <Camera className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold text-foreground/50">Hold your ID if possible</p>
                      </>
                    )}
                    <input 
                      name="selfie" 
                      type="file" 
                      accept="image/*" 
                      capture="user" 
                      required 
                      onChange={(e) => handleFileChange(e, 'selfie')}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border flex flex-col items-center gap-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-primary-foreground text-xl font-black rounded-2xl disabled:opacity-50 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
                <p className="text-sm text-foreground/40 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Your data is encrypted and stored securely.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
