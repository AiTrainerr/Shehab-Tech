"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Trash2, Image as ImageIcon } from "lucide-react"
import { updatePortfolioItem, deletePortfolioItem } from "@/app/actions/portfolio"

interface Props {
  portfolio: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
  }
}

export default function EditPortfolioForm({ portfolio }: Props) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [preview, setPreview] = React.useState<string | null>(portfolio.imageUrl)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const res = await updatePortfolioItem(portfolio.id, formData)
    
    setSaving(false)
    if (res.success) {
      alert("Portfolio item updated!")
      router.push("/member/profile")
      router.refresh()
    } else {
      setError(res.error || "Failed to update item")
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return
    setDeleting(true)
    const res = await deletePortfolioItem(portfolio.id)
    setDeleting(false)
    if (res.success) {
      router.push("/member/profile")
      router.refresh()
    } else {
      alert(res.error || "Failed to delete item")
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-2xl border border-border">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-semibold">Project Title</label>
          <input name="title" type="text" defaultValue={portfolio.title} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Description</label>
          <textarea name="description" rows={4} defaultValue={portfolio.description || ""} placeholder="Describe what you did..." className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none resize-none" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Update Image (Optional)</label>
          <div className="flex items-center gap-4">
            {preview ? (
              <img src={preview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-background border border-border flex items-center justify-center text-foreground/40">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <input name="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1 px-4 py-3 rounded-xl bg-background border border-border file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-border">
          <button type="button" onClick={handleDelete} disabled={deleting || saving} className="px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl flex items-center gap-2 hover:bg-red-500/20 transition-all disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
          
          <div className="flex gap-4">
            <button type="button" onClick={() => router.push("/member/profile")} className="px-6 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-card transition-colors">Cancel</button>
            <button type="submit" disabled={saving || deleting} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
