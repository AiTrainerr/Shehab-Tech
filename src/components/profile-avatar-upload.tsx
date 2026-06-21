"use client"

import * as React from "react"
import { User, Camera, Loader2, Check, X } from "lucide-react"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/cropImage"
import { updateAvatar } from "@/app/actions/user"
import { compressImage } from "@/lib/image-compress"

export function ProfileAvatarUpload({ initialAvatar, fullAvatar }: { initialAvatar: string | null, fullAvatar?: string | null }) {
  const [avatar, setAvatar] = React.useState(initialAvatar)
  const [hovered, setHovered] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Cropper state
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [rawFile, setRawFile] = React.useState<File | null>(null)
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRawFile(file)
    const reader = new FileReader()
    reader.addEventListener("load", () => setImageSrc(reader.result as string))
    reader.readAsDataURL(file)
    // Clear input
    e.target.value = ""
  }

  const onCropComplete = React.useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels || !rawFile) return

    setIsUploading(true)
    try {
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (!croppedImageFile) throw new Error("Failed to crop image")

      const formData = new FormData()
      formData.append("avatar", croppedImageFile)
      
      const compressedFullAvatar = await compressImage(rawFile)
      formData.append("fullAvatar", compressedFullAvatar)

      const result = await updateAvatar(formData)
      if (result.success && result.avatarUrl) {
        setAvatar(result.avatarUrl)
        setImageSrc(null)
      } else {
        alert(result.error || "Failed to upload image")
      }
    } catch (e) {
      console.error(e)
      alert("Error cropping image")
    }
    setIsUploading(false)
  }

  return (
    <>
      <div 
        translate="no"
        className="relative shrink-0 group z-10"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden transition-all shadow-inner relative z-20">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-primary/50" />
          )}
        </div>
        
        {hovered && (fullAvatar || avatar) && !isUploading && (
          <div className="absolute top-0 left-full ml-4 w-64 h-64 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 pointer-events-none animate-in fade-in zoom-in-95">
            <img src={fullAvatar || avatar!} alt="Full Avatar" className="w-full h-full object-contain" />
          </div>
        )}
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 disabled:opacity-50 z-30"
          title="Change profile picture"
        >
          <Camera className="w-4 h-4" />
        </button>

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {imageSrc && (
        <div translate="no" className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">Crop Profile Picture</h3>
              <button onClick={() => setImageSrc(null)} className="p-1 rounded-full hover:bg-background transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative h-80 w-full bg-black/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-semibold mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setImageSrc(null)}
                  className="px-4 py-2 font-semibold hover:bg-background rounded-xl transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCrop}
                  disabled={isUploading}
                  className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Picture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
