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
  }
}

export default function EditProfileForm({ user }: Props) {
  const router = useRouter()
  const [showPass, setShowPass] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

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
