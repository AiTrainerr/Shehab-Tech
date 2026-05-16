"use client"

import * as React from "react"
import { User, Camera, Loader2 } from "lucide-react"
import { updateAvatar } from "@/app/actions/user"

export function ProfileAvatarUpload({ initialAvatar }: { initialAvatar: string | null }) {
  const [avatar, setAvatar] = React.useState(initialAvatar)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("avatar", file)

    const result = await updateAvatar(formData)
    if (result.success && result.avatarUrl) {
      setAvatar(result.avatarUrl)
    } else {
      alert(result.error || "Failed to upload image")
    }
    setIsUploading(false)
  }

  return (
    <div className="relative shrink-0 group">
      <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 shadow-inner">
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : avatar ? (
          <img src={avatar} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        ) : (
          <User className="w-10 h-10 text-primary/50" />
        )}
      </div>
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute -bottom-2 -right-2 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg hover:bg-primary/90 transition-all hover:scale-110 disabled:opacity-50"
        title="Change profile picture"
      >
        <Camera className="w-4 h-4" />
      </button>

      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="user"
        className="hidden"
      />
    </div>
  )
}
