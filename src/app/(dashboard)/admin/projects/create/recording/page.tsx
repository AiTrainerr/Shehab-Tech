"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, X, Globe } from "lucide-react"
import { createProjectAction } from "@/app/actions/projects"

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function CreateRecordingProjectPage() {
  const router = useRouter()
  const [langCount, setLangCount] = React.useState(1)
  const [imageCount, setImageCount] = React.useState(1)
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([])
  const [scriptType, setScriptType] = React.useState("STATIC")
  
  // Interactive UI state options
  const [executionOption, setExecutionOption] = React.useState("INTERNAL")
  const [hasScript, setHasScript] = React.useState(true)
  const [scriptMode, setScriptMode] = React.useState("file")

  const addCountry = (country: string) => {
    if (!selectedCountries.includes(country)) {
      setSelectedCountries(prev => [...prev, country])
    }
  }

  const removeCountry = (country: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== country))
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full animate-slide-up">
        <div className="mb-8">
          <Link href="/admin/projects/create" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Change Project Type
          </Link>
          <h1 className="text-3xl font-black text-foreground">
            Create Voice Recording Project
          </h1>
          <p className="text-foreground/70">Fill in the details to publish a new recording project to freelancers.</p>
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
            <input type="hidden" name="isTranscriptionProject" value="false" />

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

          {/* Execution Option & Audio Specs Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">Project Execution & Audio Specifications</h3>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Execution Method</label>
                <select
                  name="executionOption"
                  value={executionOption}
                  onChange={(e) => setExecutionOption(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                >
                  <option value="INTERNAL">Option A: Recording Inside Platform</option>
                  <option value="EXTERNAL">Option B: External Platform Redirect</option>
                </select>
              </div>

              {executionOption === "EXTERNAL" ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">External URL</label>
                  <input name="externalUrl" type="url" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="https://example.com/external-task" required />
                </div>
              ) : (
                <div className="space-y-2 opacity-50 select-none">
                  <label className="text-sm font-semibold">External URL (Disabled for Internal)</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="Disabled" disabled />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold">Audio Format</label>
                <select name="audioFormat" defaultValue="WAV" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="WAV">WAV (Lossless)</option>
                  <option value="FLAC">FLAC</option>
                  <option value="MP3">MP3</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Sample Rate</label>
                <select name="sampleRate" defaultValue="44100" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="8000">8000 Hz</option>
                  <option value="16000">16000 Hz</option>
                  <option value="22050">22050 Hz</option>
                  <option value="44100">44100 Hz</option>
                  <option value="48000">48000 Hz</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Bit Depth</label>
                <select name="bitDepth" defaultValue="16" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="16">16-bit</option>
                  <option value="24">24-bit</option>
                  <option value="32">32-bit</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Channels</label>
                <select name="channels" defaultValue="MONO" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="MONO">Mono (1 Channel)</option>
                  <option value="STEREO">Stereo (2 Channels)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Minimum Duration (seconds)</label>
                <input name="minDuration" type="number" min="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. 5" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Maximum Duration (seconds)</label>
                <input name="maxDuration" type="number" min="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. 60" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Target Males</label>
                <input name="targetMales" type="number" min="0" defaultValue="0" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. 50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Target Females</label>
                <input name="targetFemales" type="number" min="0" defaultValue="0" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. 50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">ZIP Folder Naming Rule</label>
                <select name="zipNamingRule" defaultValue="FULL" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="FULL">Full (G0001_Name_Age_Gender)</option>
                  <option value="ANONYMOUS">Anonymous (G0001_Age_Gender) – بدون الاسم</option>
                  <option value="SPEAKER_ONLY">Speaker ID Only (G0001) – الكود فقط</option>
                </select>
                <p className="text-xs text-foreground/50">يتحكم في اسم مجلد وملف ZIP عند التحميل.</p>
              </div>

            </div>
          </div>

          {/* Script Management Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">Script Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Display Script/Texts to Freelancers?</label>
                <select
                  name="hasScript"
                  value={hasScript.toString()}
                  onChange={(e) => setHasScript(e.target.value === "true")}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {hasScript && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Sentence Distribution Method</label>
                    <select
                      name="scriptType"
                      value={scriptType}
                      onChange={(e) => setScriptType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                    >
                      <option value="STATIC">Static: All users record the same file</option>
                      <option value="DYNAMIC_POOL">Dynamic Pool (Auto-Chunking): Distribute sentences evenly across users</option>
                      <option value="PRE_ASSIGNED">Pre-Assigned: Manual distribution via Email (Excel Upload)</option>
                    </select>
                  </div>
                  
                  {scriptType === "DYNAMIC_POOL" && (
                    <div className="space-y-2 md:col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
                      <label className="text-sm font-semibold text-primary">Sentences Per User (Quota)</label>
                      <p className="text-xs text-foreground/60 mb-2">How many sentences should each freelancer record from the total pool?</p>
                      <input
                        name="sentencesPerUser"
                        type="number"
                        min="1"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                        placeholder="e.g. 50"
                      />
                    </div>
                  )}

                  {scriptType === "PRE_ASSIGNED" && (
                    <div className="space-y-2 md:col-span-2 bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                      <label className="text-sm font-semibold text-orange-600">Manual Allocation Guidelines</label>
                      <p className="text-xs text-foreground/80">
                        You must upload an Excel file containing exactly two columns:<br/>
                        1. <b>Sentence</b> (The text to be read)<br/>
                        2. <b>Email</b> (The user email assigned to this sentence)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold">Upload Script Mode</label>
                    <select
                      value={scriptMode}
                      onChange={(e) => setScriptMode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                    >
                      <option value="file">Upload File (XLSX, CSV, TXT)</option>
                      <option value="manual">Manual Input</option>
                    </select>
                    <input type="hidden" name="scriptMode" value={scriptMode} />
                  </div>

                  {scriptMode === "file" ? (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold">Select Script File</label>
                      <input
                        name="scriptFile"
                        type="file"
                        accept={scriptType === "PRE_ASSIGNED" ? ".xlsx,.xls" : ".xlsx,.xls,.csv,.txt"}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                        required
                      />
                      <p className="text-xs text-foreground/50">
                        {scriptType === "PRE_ASSIGNED" 
                          ? "Supported formats: Excel (.xlsx, .xls) ONLY for Pre-Assigned mode."
                          : "Supported formats: Excel (.xlsx, .xls), CSV (.csv), Plain Text (.txt)"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold">Enter Sentences (one sentence per line)</label>
                      <textarea
                        name="manualScriptText"
                        disabled={scriptType === "PRE_ASSIGNED"}
                        className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none resize-none disabled:opacity-50"
                        placeholder={scriptType === "PRE_ASSIGNED" ? "Manual input disabled for Pre-Assigned mode. Please upload an Excel file." : "Sentence 1\nSentence 2\nSentence 3..."}
                        required={scriptType !== "PRE_ASSIGNED"}
                      />
                    </div>
                  )}
                </>
              )}
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
              
              {/* Duration and unit choice */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Recording Duration</label>
                <div className="flex gap-2">
                  <input name="recordingDuration" type="number" step="0.1" min="0.1" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. 2.5 or 50" />
                  <select name="durationUnit" defaultValue="HOUR" className="w-32 px-3 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                    <option value="HOUR">Hours</option>
                    <option value="SENTENCE">Sentences</option>
                  </select>
                </div>
              </div>

              {/* Price and model choice */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Price Configuration</label>
                <div className="flex gap-2">
                  <input name="price" type="number" step="0.01" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="50.00" required />
                  <select name="pricingModel" defaultValue="FIXED_PROJECT" className="w-48 px-3 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                    <option value="FIXED_PROJECT">Fixed Task</option>
                    <option value="PER_HOUR">Per Hour</option>
                    <option value="PER_SENTENCE">Per Sentence</option>
                  </select>
                </div>
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
