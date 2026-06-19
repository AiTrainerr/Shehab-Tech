"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User, Eye, EyeOff, Mail, Phone } from "lucide-react"
import { updateProfile } from "@/app/actions/user"

interface Props {
  user: {
    firstName: string
    middleName: string | null
    lastName: string
    email: string
    phone: string | null
    whatsapp: string | null
    bio: string | null
    projectTypes: string[]
    languages: { language: string; proficiency: string }[]
    paymentMethod?: string | null
    paymentId?: string | null
    paymentEmail?: string | null
  }
}

const PROJECT_TYPES = [
  "Translation",
  "Transcription",
  "Voice Recording",
  "Data Entry",
  "AI Training",
  "Video Creation",
]

export default function EditProfileForm({ user }: Props) {
  const router = useRouter()
  const [showPass, setShowPass] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  
  const [languages, setLanguages] = React.useState(user.languages || [])
  
  const addLanguage = () => {
    if (languages.length < 4) {
      setLanguages([...languages, { language: "", proficiency: "Beginner" }])
    }
  }
  
  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index))
  }
  
  const updateLanguage = (index: number, field: string, value: string) => {
    const newLangs = [...languages]
    newLangs[index] = { ...newLangs[index], [field]: value }
    setLanguages(newLangs)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const res = await updateProfile(formData)
    
    setSaving(false)
    if (res.success) {
      alert("Profile updated successfully!")
      router.push("/member/profile")
      router.refresh()
    } else {
      setError(res.error || "Failed to update profile")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-2xl border border-border">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">First Name</label>
          <input name="firstName" type="text" defaultValue={user.firstName} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Middle Name</label>
          <input name="middleName" type="text" defaultValue={user.middleName || ""} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Last Name</label>
          <input name="lastName" type="text" defaultValue={user.lastName} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Email Address
          </label>
          <input name="email" type="email" defaultValue={user.email} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" /> Phone Number
          </label>
          <input name="phone" type="tel" defaultValue={user.phone || ""} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Bio</label>
        <textarea name="bio" rows={3} defaultValue={user.bio || ""} placeholder="Tell others about yourself..." className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none resize-none" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">WhatsApp</label>
        <input name="whatsapp" type="tel" defaultValue={user.whatsapp || ""} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
      </div>

      {/* Project Types */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-lg font-bold">Project Preferences</h3>
        <p className="text-sm text-foreground/60 mb-2">Select the types of projects you'd like to work on.</p>
        <div className="flex flex-wrap gap-3">
          {PROJECT_TYPES.map((pt) => (
            <label key={pt} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-foreground/5 transition-colors">
              <input 
                type="checkbox" 
                name="projectTypes" 
                value={pt} 
                defaultChecked={user.projectTypes?.includes(pt)} 
                className="w-4 h-4 text-primary focus:ring-primary rounded border-border bg-background"
              />
              <span className="text-sm font-semibold">{pt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="border-t border-border pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Languages</h3>
            <p className="text-sm text-foreground/60">Add up to 4 languages you speak and your proficiency.</p>
          </div>
          {languages.length < 4 && (
            <button type="button" onClick={addLanguage} className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors text-sm">
              + Add Language
            </button>
          )}
        </div>
        
        {languages.length === 0 ? (
          <div className="text-sm text-foreground/50 italic p-4 bg-background/50 rounded-lg border border-border">No languages added yet.</div>
        ) : (
          <div className="space-y-3">
            {languages.map((lang, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input 
                  type="text"
                  name={`language_${index}`}
                  value={lang.language}
                  onChange={(e) => updateLanguage(index, "language", e.target.value)}
                  placeholder="e.g. English, Arabic"
                  className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                  required
                />
                <select 
                  name={`proficiency_${index}`}
                  value={lang.proficiency}
                  onChange={(e) => updateLanguage(index, "proficiency", e.target.value)}
                  className="w-[140px] px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                >
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Beginner">Beginner</option>
                </select>
                <button type="button" onClick={() => removeLanguage(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-lg font-bold">Payment Method (طريقة الدفع)</h3>
        <p className="text-sm text-foreground/60 mb-2">Set up how you want to receive your earnings.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Method (الطريقة)</label>
            <select 
              name="paymentMethod" 
              defaultValue={user.paymentMethod || ""} 
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
            >
              <option value="">Select Method</option>
              <option value="PayPal">PayPal (بيبال)</option>
              <option value="Binance">Binance (بينانس)</option>
              <option value="Instapay">Instapay (انستاباي)</option>
              <option value="Cash">Cash (كاش)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Payment ID / Number (المعرف / الرقم)</label>
            <input 
              name="paymentId" 
              type="text" 
              defaultValue={user.paymentId || ""} 
              placeholder="e.g. Wallet ID, Phone Number" 
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Payment Email (الايميل)</label>
            <input 
              name="paymentEmail" 
              type="email" 
              defaultValue={user.paymentEmail || ""} 
              placeholder="e.g. paypal@example.com" 
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-base font-bold mb-4">Change Password</h3>
        <div className="relative">
          <input name="password" type={showPass ? "text" : "password"} placeholder="Leave blank to keep current password" title="Minimum 6 characters" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none pr-12" />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Link href="/member/profile" className="px-6 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-card transition-colors">Cancel</Link>
        <button type="submit" disabled={saving} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
