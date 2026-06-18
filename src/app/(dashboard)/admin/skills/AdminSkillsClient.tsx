"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Plus, Link as LinkIcon, ImageIcon, Trash2, Upload, Save } from "lucide-react"
import { createLearningResource, deleteLearningResource } from "@/app/actions/learning"
import { LearningResource } from "@prisma/client"

interface Props { resources: LearningResource[] }

export function AdminSkillsClient({ resources }: Props) {
  const router = useRouter()
  const [preview, setPreview] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [showForm, setShowForm] = React.useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setError("")
    const res = await createLearningResource(formData)
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setPreview(null)
      router.refresh()
    } else {
      setError(res.error || "Something went wrong")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resource?")) return
    await deleteLearningResource(id)
    router.refresh()
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto">
      <div>
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" /> Learn Skills
            </h1>
            <p className="text-foreground/70">Publish learning resources for your freelancers.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Resource"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form action={handleSubmit} className="glass p-6 rounded-2xl border border-primary/30 mb-8 space-y-4">
            <h2 className="text-lg font-bold">New Learning Resource</h2>
            {error && <p className="text-red-400 text-sm font-semibold bg-red-500/10 px-4 py-2 rounded-xl">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Title <span className="text-red-400">*</span></label>
                <input name="title" type="text" required placeholder="e.g. Introduction to Arabic Transcription" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Category</label>
                <input name="category" type="text" placeholder="e.g. Transcription, Translation, Recording..." className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2"><LinkIcon className="w-4 h-4 text-primary" /> Resource Link <span className="text-red-400">*</span></label>
              <input name="link" type="url" required placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Description</label>
              <textarea name="description" rows={3} placeholder="What will members learn from this resource?" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Thumbnail Image</label>
              <label className="block cursor-pointer">
                <input name="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border h-40">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-sm">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-foreground/50 hover:border-primary/50 hover:text-primary/50 transition-colors">
                    <Upload className="w-8 h-8" />
                    <p className="font-semibold text-sm">Click to upload thumbnail</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? "Publishing..." : "Publish Resource"}
              </button>
            </div>
          </form>
        )}

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <div className="glass p-16 rounded-2xl border border-border text-center">
            <BookOpen className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Resources Yet</h3>
            <p className="text-foreground/60">Click "Add Resource" to publish your first learning material.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((r) => (
              <div key={r.id} className="glass rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all group flex flex-col">
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt={r.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-primary/5 flex items-center justify-center border-b border-border">
                    <BookOpen className="w-8 h-8 text-primary/30" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  {r.category && <span className="text-xs font-bold text-primary mb-2">{r.category}</span>}
                  <h3 className="font-bold text-lg leading-tight mb-2">{r.title}</h3>
                  {r.description && <p className="text-sm text-foreground/60 leading-relaxed flex-1">{r.description}</p>}
                  <div className="mt-4 flex items-center gap-2">
                    <a href={r.link} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5" /> Open Link
                    </a>
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
