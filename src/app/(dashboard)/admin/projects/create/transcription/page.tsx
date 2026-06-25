"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, X, Globe, UploadCloud, FileAudio, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createProjectAction } from "@/app/actions/projects"

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function CreateTranscriptionProjectPage() {
  const router = useRouter()
  const [langCount, setLangCount] = React.useState(1)
  const [imageCount, setImageCount] = React.useState(1)
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([])

  const addCountry = (country: string) => {
    if (!selectedCountries.includes(country)) {
      setSelectedCountries(prev => [...prev, country])
    }
  }

  const removeCountry = (country: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== country))
  }

  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState("")

  const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadStatus("Starting upload...")
    setUploadProgress(0)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      // Get audio files
      const audioFiles = formData.getAll("transcriptionFiles") as File[]
      
      // If there are valid audio files, upload them one by one to show progress
      const preUploadedAudio: { url: string, name: string }[] = []
      
      if (audioFiles.length > 0 && audioFiles[0].size > 0) {
        // Remove from formData so we don't send huge payloads to the Next.js action
        formData.delete("transcriptionFiles")
        
        for (let i = 0; i < audioFiles.length; i++) {
          const file = audioFiles[i]
          // 1. Get Cloudinary Signature
          const signRes = await fetch("/api/cloudinary/sign", { method: "POST" })
          if (!signRes.ok) throw new Error("Failed to get upload signature")
          const { timestamp, signature, folder, apiKey, cloudName } = await signRes.json()

          // 2. Upload directly to Cloudinary
          const url = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, true)
            
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const fileProgress = event.loaded / event.total
                const overallProgress = Math.round(((i + fileProgress) / audioFiles.length) * 100)
                setUploadProgress(overallProgress)
              }
            }
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const res = JSON.parse(xhr.responseText)
                if (res.secure_url) resolve(res.secure_url)
                else reject(new Error("Failed to get secure URL from Cloudinary"))
              } else {
                reject(new Error(`Cloudinary upload failed with status ${xhr.status}`))
              }
            }
            
            xhr.onerror = () => reject(new Error("Network Error"))
            
            const uploadData = new FormData()
            uploadData.append("file", file)
            uploadData.append("api_key", apiKey)
            uploadData.append("timestamp", timestamp.toString())
            uploadData.append("signature", signature)
            uploadData.append("folder", folder)
            
            xhr.send(uploadData)
          })
          
          preUploadedAudio.push({ url, name: file.name })
        }
      }

      setUploadStatus("Saving project to database...")
      setUploadProgress(100)
      
      // Add the pre-uploaded URLs
      if (preUploadedAudio.length > 0) {
        formData.append("preUploadedAudio", JSON.stringify(preUploadedAudio))
      }

      const res = await createProjectAction(formData)
      if (res.success) {
        router.push("/admin")
      } else {
        throw new Error(res.error || "Something went wrong creating the project")
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message || "An error occurred during upload")
      setIsUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full animate-slide-up">
        <div className="mb-8">
          <Link href="/admin/projects/create" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Change Project Type
          </Link>
          <h1 className="text-3xl font-black text-foreground">
            Create Audio Transcription Project
          </h1>
          <p className="text-foreground/70">Fill in the details to publish a new transcription project to freelancers.</p>
        </div>

        {isUploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass p-8 rounded-3xl border border-primary/20 shadow-2xl shadow-primary/10 max-w-sm w-full mx-4 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-background border border-primary/20 p-4 rounded-full">
                  {uploadProgress === 100 ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-primary animate-bounce" />
                  )}
                </div>
              </div>
              
              <h3 className="font-black text-xl mb-2 text-foreground">
                {uploadProgress === 100 ? "Finalizing Setup..." : "Uploading Files..."}
              </h3>
              <p className="text-sm text-foreground/60 mb-6 font-medium max-w-[250px] truncate">
                {uploadStatus || "Please wait while we process your project data."}
              </p>
              
              <div className="w-full bg-background/50 rounded-full h-3 overflow-hidden border border-border shadow-inner">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <p className="text-xs font-bold mt-3 text-primary tracking-wider">{uploadProgress}%</p>
            </div>
          </div>
        )}

        <form onSubmit={handleClientSubmit} className={`space-y-8 glass p-8 rounded-2xl border border-border ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">General Information</h3>
            <input type="hidden" name="isTranscriptionProject" value="true" />

            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Title</label>
              <input name="title" type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Arabic Audio Transcription" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Workflow Type</label>
              <select name="workflowType" defaultValue="MOD_ONLY" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none" required>
                <option value="MOD_ONLY">Mod Only (1-Stage: Transcriber submits directly)</option>
                <option value="MOD_AND_QC">Mod and QC (2-Stages: Transcriber then QC Review)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Public Description</label>
              <textarea name="description" className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="Describe the project..." required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-red-500 flex items-center gap-2">Private Data <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-xs">Hidden from public</span></label>
              <textarea name="privateData" className="w-full h-24 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none placeholder:text-red-500/40" placeholder="Links, credentials, or specific tasks revealed ONLY to approved freelancers..." />
              <p className="text-xs text-foreground/50">This information will be securely hidden until you explicitly Approve a freelancer's application.</p>
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
                    <option value="Native">Native</option>
                    <option value="Near Native">Near Native</option>
                    <option value="Beginner">Beginner</option>
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

          {/* Audio Upload Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">Audio Files (Tasks)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Export Format</label>
                <select name="outputFormat" defaultValue="WORD" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="WORD">Word (.docx)</option>
                  <option value="EXCEL">Excel (.xlsx)</option>
                  <option value="JSON">JSON</option>
                  <option value="SRT">SRT (Subtitles)</option>
                </select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Upload Audio Files (Creates 1 Task per File)</label>
                <input name="transcriptionFiles" type="file" accept="audio/*" multiple className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
                <p className="text-xs text-foreground/50">You can select multiple files. Each file will be treated as an individual transcription task.</p>
              </div>
            </div>
          </div>

          {/* Other Requirements */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">Other Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Required Countries <span className="text-foreground/40 font-normal">(leave empty = Anywhere)</span></label>
                
                {/* Hidden input storing JSON array of selected countries */}
                <input type="hidden" name="reqCountry" value={selectedCountries.length > 0 ? JSON.stringify(selectedCountries) : ""} />
                
                {/* Selected Country Tags */}
                {selectedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCountries.map(c => (
                      <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-semibold">
                        {c}
                        <button type="button" onClick={() => removeCountry(c)} className="hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    <button type="button" onClick={() => setSelectedCountries([])} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-500 font-bold rounded-full border border-red-400/20 hover:bg-red-500/10 transition-colors">
                      Clear All
                    </button>
                  </div>
                )}

                {/* Dropdown Select */}
                <select
                  value=""
                  onChange={e => { if (e.target.value) addCountry(e.target.value) }}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">— Select a country to add —</option>
                  {COUNTRIES.filter(c => !selectedCountries.includes(c)).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              {/* Price and model choice */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Reward Price Configuration</label>
                <div className="flex gap-2">
                  <input name="price" type="number" step="0.01" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. 10.00" required />
                  <select name="pricingModel" defaultValue="FIXED_PROJECT" className="w-48 px-3 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                    <option value="FIXED_PROJECT">Fixed per Task</option>
                    <option value="PER_HOUR">Per Audio Hour</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                  <input name="autoApprove" type="checkbox" value="true" className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                  <div>
                    <p className="font-bold text-sm text-foreground">Auto-Approve All Applicants</p>
                    <p className="text-xs text-foreground/60">If checked, anyone who applies will be automatically approved and can see private project instructions.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/projects/create" className="px-6 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-card transition-colors">
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
