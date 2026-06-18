"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { createProjectAction } from "@/app/actions/projects"

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

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
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Price per Task ($)</label>
                <input name="price" type="number" step="0.01" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="50.00" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Recording Duration (hours) <span className="text-foreground/40 font-normal">— for voice projects</span></label>
                <input name="recordingDuration" type="number" step="0.5" min="0.5" max="24" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. 2.5" />
                <p className="text-xs text-foreground/50">Leave empty if not a voice recording project.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Age Range (Optional)</label>
                <div className="flex gap-2 items-center">
                  <input name="reqAgeMin" type="number" min="18" max="80" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="Min age (18)" />
                  <span className="text-foreground/50 font-bold">–</span>
                  <input name="reqAgeMax" type="number" min="18" max="80" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="Max age (60)" />
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
