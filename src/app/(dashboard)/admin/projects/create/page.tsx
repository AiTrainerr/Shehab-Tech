"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { createProjectAction } from "@/app/actions/projects"

export default function CreateProjectPage() {
  const router = useRouter()
  const [langCount, setLangCount] = React.useState(1)
  const [imageCount, setImageCount] = React.useState(1)

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-foreground">Create New Project</h1>
          <p className="text-foreground/70">Fill in the details to publish a new project to freelancers.</p>
        </div>

        <form action={async (formData) => {
          const res = await createProjectAction(formData)
          if (res.success) {
            router.push("/admin")
          } else {
            alert(res.error || "Something went wrong")
          }
        }} className="space-y-8 glass p-8 rounded-2xl border border-border">
          
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">General Information</h3>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Title</label>
              <input name="title" type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Arabic Voice Recording" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Description</label>
              <textarea name="description" className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="Describe the project..." required />
            </div>
          </div>

          {/* Languages Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Languages & Proficiencies</h3>
              <button type="button" onClick={() => setLangCount(prev => prev + 1)} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Add Language
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
                  <label className="text-sm font-semibold">Language</label>
                  <input name={`language_${i}`} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. Arabic" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Dialect (Optional)</label>
                  <input name={`dialect_${i}`} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. Egyptian" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Level</label>
                  <select name={`proficiency_${i}`} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none appearance-none" required>
                    <option value="">Select Level</option>
                    <option value="Native">Native (نيتف)</option>
                    <option value="Near Native">Near Native (نيرتيف)</option>
                    <option value="Beginner">Beginner (مبتدأ)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Project Images Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Project Images & Captions</h3>
              <button type="button" onClick={() => setImageCount(prev => prev + 1)} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Add Image
              </button>
            </div>
            <input type="hidden" name="imageCount" value={imageCount} />
            
            {Array.from({ length: imageCount }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-card/50 relative">
                {i > 0 && (
                  <button type="button" onClick={() => setImageCount(prev => prev - 1)} className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Upload Image</label>
                  <input name={`image_${i}`} type="file" accept="image/*" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Caption / Explanation</label>
                  <input name={`caption_${i}`} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="Explain what to do in this image..." />
                </div>
              </div>
            ))}
          </div>

          {/* Other Requirements */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">Other Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Required Country</label>
                <select name="reqCountry" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all appearance-none">
                  <option value="">Anywhere</option>
                  <option value="EG">Egypt</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Price per Task ($)</label>
                <input name="price" type="number" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="50.00" required />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin" className="px-6 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-card transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
              <Save className="w-5 h-5" /> Publish Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
