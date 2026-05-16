"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, ImageIcon, FileText, Save } from "lucide-react"
import { addPortfolioItem } from "@/app/actions/portfolio"

export default function AddPortfolioPage() {
  const router = useRouter()
  const [preview, setPreview] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setError("")
    const res = await addPortfolioItem(formData)
    setSaving(false)
    if (res.success) {
      router.push("/member/profile")
    } else {
      setError(res.error || "Something went wrong")
    }
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto w-full">
        <Link href="/member/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" /> Add Portfolio Item
        </h1>
        <p className="text-foreground/70 mb-8">Showcase your work — add images, text descriptions, or both. Visible to admins and all members.</p>

        <form action={handleSubmit} className="space-y-6 glass p-8 rounded-2xl border border-border">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold">Title <span className="text-red-400">*</span></label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Arabic Voice Sample, Translation Project..."
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Description / Text Content
            </label>
            <textarea
              name="description"
              rows={5}
              placeholder="Describe your work, what skills were used, outcomes, etc. (Optional)"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> Image (Optional)
            </label>
            <label className="block cursor-pointer">
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-bold text-sm">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 text-foreground/50 hover:border-primary/50 hover:text-primary/50 transition-colors">
                  <Upload className="w-10 h-10" />
                  <p className="font-semibold">Click to upload image</p>
                  <p className="text-xs">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-2">
            <Link href="/member/profile" className="px-6 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-card transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Publishing..." : "Publish Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
