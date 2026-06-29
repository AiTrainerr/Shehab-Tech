"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, X, Globe, FileText, Unlock } from "lucide-react"
import { updateProjectAction, releaseIncompleteSentences } from "@/app/actions/projects"

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [project, setProject] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Dynamic lists and requirement states
  const [languages, setLanguages] = React.useState<any[]>([])
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([])
  const [countrySearch, setCountrySearch] = React.useState("")
  const [showDropdown, setShowDropdown] = React.useState(false)

  // Options toggles
  const [executionOption, setExecutionOption] = React.useState("INTERNAL")
  const [hasScript, setHasScript] = React.useState(true)
  const [updateScript, setUpdateScript] = React.useState(false)
  const [scriptMode, setScriptMode] = React.useState("file")
  const [sentenceCount, setSentenceCount] = React.useState(0)

  React.useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        const proj = data.project
        setProject(proj)
        setLanguages(proj.languages || [])
        setExecutionOption(proj.executionOption || "INTERNAL")
        setHasScript(proj.hasScript !== false)
        setSentenceCount(data.sentenceCount || 0)

        const initialCountries: string[] = []
        if (proj.reqCountry) {
          try {
            const parsed = JSON.parse(proj.reqCountry)
            if (Array.isArray(parsed)) {
              initialCountries.push(...parsed)
            } else {
              initialCountries.push(proj.reqCountry)
            }
          } catch {
            initialCountries.push(proj.reqCountry)
          }
        }
        setSelectedCountries(initialCountries)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }, [id])

  const addCountry = (country: string) => {
    if (!selectedCountries.includes(country)) {
      setSelectedCountries(prev => [...prev, country])
    }
    setCountrySearch("")
    setShowDropdown(false)
  }

  const removeCountry = (country: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== country))
  }

  const handleLangChange = (index: number, field: string, value: string) => {
    setLanguages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addLanguage = () => {
    setLanguages(prev => [...prev, { language: "", dialect: "", proficiency: "Native" }])
  }

  const removeLanguage = (index: number) => {
    setLanguages(prev => prev.filter((_, i) => i !== index))
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase()) && !selectedCountries.includes(c)
  )

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-black text-foreground">Edit Project Details</h1>
          <p className="text-foreground/70">Modify all technical specifications, requirements, configurations, and script files.</p>
        </div>

        <form action={async (formData) => {
          // Append complex lists to formData
          formData.append("langCount", languages.length.toString())
          languages.forEach((lang, idx) => {
            formData.append(`language_${idx}`, lang.language)
            formData.append(`dialect_${idx}`, lang.dialect || "")
            formData.append(`proficiency_${idx}`, lang.proficiency || "")
          })

          formData.append("reqCountry", selectedCountries.length > 0 ? JSON.stringify(selectedCountries) : "")
          formData.append("updateScript", updateScript.toString())
          formData.append("hasScript", hasScript.toString())

          const res = await updateProjectAction(id, formData)
          if (res.success) {
            router.push("/admin/projects")
          } else {
            alert(res.error || "Something went wrong")
          }
        }} className="space-y-8 glass p-8 rounded-2xl border border-border">
          
          {/* General Information */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Project Title</label>
                <input name="title" defaultValue={project.title} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" required />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Public Description</label>
                <textarea name="description" defaultValue={project.description} className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Project Status</label>
                <select name="status" defaultValue={project.status} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Target Males</label>
                <input name="targetMales" type="number" min="0" defaultValue={project.targetMales || 0} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Target Females</label>
                <input name="targetFemales" type="number" min="0" defaultValue={project.targetFemales || 0} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">ZIP Internal Recording Naming Rule</label>
                <select name="namingRule" defaultValue={project.namingRule || "SEQUENCE"} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="SEQUENCE">Sequential Number (1, 2, 3...)</option>
                  <option value="TEXT">Recorded Sentence Text (sentence_text)</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-red-500 flex items-center gap-2">Private Data <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-xs">Hidden from public</span></label>
                <textarea name="privateData" defaultValue={project.privateData || ""} className="w-full h-24 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none placeholder:text-red-500/40" />
              </div>
            </div>
          </div>

          {/* Languages Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Languages & Proficiencies</h3>
              <button type="button" onClick={addLanguage} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Add Language
              </button>
            </div>
            
            {languages.map((lang, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-xl bg-card/50 relative">
                <button type="button" onClick={() => removeLanguage(idx)} className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Language</label>
                  <input value={lang.language} onChange={e => handleLangChange(idx, "language", e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Dialect (Optional)</label>
                  <input value={lang.dialect || ""} onChange={e => handleLangChange(idx, "dialect", e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Level</label>
                  <select value={lang.proficiency || ""} onChange={e => handleLangChange(idx, "proficiency", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required>
                    <option value="Native">Native</option>
                    <option value="Near Native">Near Native</option>
                    <option value="Beginner">Beginner</option>
                  </select>
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
                  <input name="externalUrl" defaultValue={project.externalUrl || ""} type="url" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
                </div>
              ) : (
                <div className="space-y-2 opacity-50 select-none">
                  <label className="text-sm font-semibold">External URL (Disabled for Internal)</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none" placeholder="Disabled" disabled />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold">Audio Format</label>
                <select name="audioFormat" defaultValue={project.audioFormat || "WAV"} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="WAV">WAV (Lossless)</option>
                  <option value="FLAC">FLAC</option>
                  <option value="WEBM">WEBM</option>
                  <option value="MP3">MP3</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Sample Rate</label>
                <select name="sampleRate" defaultValue={project.sampleRate || 44100} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="8000">8000 Hz</option>
                  <option value="16000">16000 Hz</option>
                  <option value="22050">22050 Hz</option>
                  <option value="44100">44100 Hz</option>
                  <option value="48000">48000 Hz</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Bit Depth</label>
                <select name="bitDepth" defaultValue={project.bitDepth || 16} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="16">16-bit</option>
                  <option value="24">24-bit</option>
                  <option value="32">32-bit</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Channels</label>
                <select name="channels" defaultValue={project.channels || "MONO"} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                  <option value="MONO">Mono (1 Channel)</option>
                  <option value="STEREO">Stereo (2 Channels)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Minimum Duration (seconds)</label>
                <input name="minDuration" defaultValue={project.minDuration || ""} type="number" min="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. 5" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Maximum Duration (seconds)</label>
                <input name="maxDuration" defaultValue={project.maxDuration || ""} type="number" min="1" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="e.g. 60" />
              </div>
            </div>
          </div>

          {/* Script/Sentence Management Section */}
          <div className="space-y-4 border-b border-border pb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Script Configuration</h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1">
                <FileText className="w-3 h-3" /> Current: {sentenceCount} sentences
              </span>
            </div>

            <div className="space-y-4 bg-primary/5 p-5 border border-primary/20 rounded-2xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateScript}
                  onChange={(e) => setUpdateScript(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-bold text-sm text-foreground">Replace project sentences/script?</p>
                  <p className="text-xs text-foreground/50">Check this box if you want to upload a new script file or change the manual sentence list.</p>
                </div>
              </label>

              {updateScript && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-primary/25">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Display Script to Freelancers?</label>
                    <select
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
                        <label className="text-sm font-semibold">Script Type</label>
                        <select name="scriptType" defaultValue={project.scriptType || "STATIC"} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                          <option value="STATIC">Static script for all participants</option>
                          <option value="RANDOM">Random script from pool</option>
                          <option value="CATEGORY">Custom category-based script</option>
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold">Upload Script Mode</label>
                        <select
                          value={scriptMode}
                          onChange={(e) => setScriptMode(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                        >
                          <option value="file">Upload File (Excel, CSV, TXT)</option>
                          <option value="manual">Manual Input</option>
                        </select>
                        <input type="hidden" name="scriptMode" value={scriptMode} />
                      </div>

                      {scriptMode === "file" ? (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold">Select Script File</label>
                          <input name="scriptFile" type="file" accept=".xlsx,.xls,.csv,.txt" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" required />
                          <p className="text-xs text-foreground/50">Supported formats: XLSX, XLS, CSV, TXT</p>
                        </div>
                      ) : (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold">Enter Sentences (one per line)</label>
                          <textarea name="manualScriptText" className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none resize-none" placeholder="Sentence 1&#10;Sentence 2..." required />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Requirements & Target Metrics */}
          <div className="space-y-4 border-b border-border pb-8">
            <h3 className="text-lg font-bold text-foreground">Target Metrics & Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Required Countries <span className="text-foreground/40 font-normal">(leave empty = Anywhere)</span></label>
                
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

                {/* Country selector */}
                <select
                  value=""
                  onChange={e => { if (e.target.value) addCountry(e.target.value) }}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                >
                  <option value="">— Select a country to add —</option>
                  {COUNTRIES.filter(c => !selectedCountries.includes(c)).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Recording Duration</label>
                <div className="flex gap-2">
                  <input name="recordingDuration" defaultValue={project.recordingDuration || ""} type="number" step="0.1" min="0.1" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  <select name="durationUnit" defaultValue={project.durationUnit || "HOUR"} className="w-32 px-3 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                    <option value="HOUR">Hours</option>
                    <option value="SENTENCE">Sentences</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Price Configuration</label>
                <div className="flex gap-2">
                  <input name="price" defaultValue={project.price} type="number" step="0.01" className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" required />
                  <select name="pricingModel" defaultValue={project.pricingModel || "FIXED_PROJECT"} className="w-48 px-3 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none">
                    <option value="FIXED_PROJECT">Fixed Task</option>
                    <option value="PER_HOUR">Per Hour</option>
                    <option value="PER_SENTENCE">Per Sentence</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Age Range (Optional)</label>
                <div className="flex gap-2 items-center">
                  <input name="reqAgeMin" defaultValue={project.reqAgeMin || ""} type="number" min="18" max="80" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="Min age" />
                  <span className="text-foreground/50 font-bold">–</span>
                  <input name="reqAgeMax" defaultValue={project.reqAgeMax || ""} type="number" min="18" max="80" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none" placeholder="Max age" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                  <input name="autoApprove" type="checkbox" value="true" defaultChecked={project.autoApprove} className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                  <div>
                    <p className="font-bold text-sm text-foreground">Auto-Approve All Applicants</p>
                    <p className="text-xs text-foreground/50">Automatically approve any member application instantly.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {project.scriptType === "DYNAMIC_POOL" && (
            <div className="space-y-4 border-b border-border pb-8">
              <h3 className="text-lg font-bold text-red-500">Advanced Actions (Dynamic Pool)</h3>
              <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/20">
                <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2"><Unlock className="w-5 h-5" /> Release Incomplete Sentences</h4>
                <p className="text-sm text-foreground/70 mb-4">
                  If some freelancers abandoned their tasks, their reserved sentences might be locked. Clicking this button will release all sentences that have been assigned to users but do NOT have any "ACCEPTED" or "PENDING" recordings, returning them to the pool.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to release all incomplete sentences back to the pool?")) {
                      const res = await releaseIncompleteSentences(id)
                      if (res.success) {
                        alert(`Successfully released ${res.releasedCount} sentences back to the pool!`)
                      } else {
                        alert("Error: " + res.error)
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                >
                  Release Sentences Now
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/projects" className="px-6 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-card transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
              <Save className="w-5 h-5" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
