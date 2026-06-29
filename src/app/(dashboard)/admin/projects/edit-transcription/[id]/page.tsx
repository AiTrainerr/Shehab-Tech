"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, Globe, FileText, Headphones, X } from "lucide-react"
import { updateProjectAction } from "@/app/actions/projects"

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function EditTranscriptionProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [project, setProject] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Dynamic lists and requirement states
  const [languages, setLanguages] = React.useState<any[]>([])
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([])
  const [countrySearch, setCountrySearch] = React.useState("")
  const [showDropdown, setShowDropdown] = React.useState(false)

  React.useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        const proj = data.project
        setProject(proj)
        setLanguages(proj.languages || [])

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

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto">
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="mb-8 flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> Edit Transcription Project
          </h1>
          <p className="text-foreground/70">Update the transcription project configuration.</p>
        </div>
      </div>

      <form action={async (formData) => {
        try {
          formData.append("projectId", project.id)
          formData.append("reqCountry", JSON.stringify(selectedCountries))
          formData.append("languages", JSON.stringify(languages))
          
          const res = await updateProjectAction(project.id, formData)
          if (res.success) {
            router.push("/admin/projects")
            router.refresh()
          } else {
            alert(res.error)
          }
        } catch (e) {
          console.error(e)
          alert("Update failed")
        }
      }} className="space-y-8 pb-32">

        {/* Basic Details */}
        <section className="glass p-8 rounded-[32px] border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Basic Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Project Title *</label>
              <input type="text" name="title" defaultValue={project.title} required className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Description *</label>
              <textarea name="description" defaultValue={project.description} required rows={3} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Guidelines / Instructions</label>
              <textarea name="instructions" defaultValue={project.instructions} rows={4} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none transition-colors resize-none" placeholder="Provide formatting rules..." />
            </div>
          </div>
        </section>

        {/* Transcription Settings */}
        <section className="glass p-8 rounded-[32px] border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Headphones className="w-5 h-5 text-purple-500" /> Transcription Settings</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Workflow Type</label>
              <select name="workflowType" defaultValue={project.workflowType} className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none">
                <option value="MOD_ONLY">Transcriber &rarr; Moderator</option>
                <option value="MOD_AND_QC">Transcriber &rarr; Moderator &rarr; QA/QC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Output Format</label>
              <select name="outputFormat" defaultValue={project.outputFormat} className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none">
                <option value="WORD">Word Document (.docx)</option>
                <option value="EXCEL">Excel (.xlsx)</option>
                <option value="SRT">Subtitles (.srt)</option>
                <option value="JSON">JSON</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="allowFreelancerDownload" defaultChecked={project.allowFreelancerDownload} className="w-5 h-5 accent-primary" />
                <span className="font-semibold text-foreground">Allow Freelancers to download the original audio/video file</span>
              </label>
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="glass p-8 rounded-[32px] border border-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Languages</h2>
            <button type="button" onClick={addLanguage} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-4 h-4" /> Add Language
            </button>
          </div>
          <div className="space-y-4">
            {languages.map((lang, index) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-background/50 p-4 rounded-2xl border border-border/50">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-foreground/60 mb-1">Language</label>
                  <input type="text" value={lang.language} onChange={e => handleLangChange(index, 'language', e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none text-sm" placeholder="e.g. English" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-bold text-foreground/60 mb-1">Dialect (Optional)</label>
                  <input type="text" value={lang.dialect} onChange={e => handleLangChange(index, 'dialect', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none text-sm" placeholder="e.g. US" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-bold text-foreground/60 mb-1">Proficiency</label>
                  <select value={lang.proficiency} onChange={e => handleLangChange(index, 'proficiency', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl outline-none text-sm">
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Beginner">Beginner</option>
                  </select>
                </div>
                {languages.length > 1 && (
                  <button type="button" onClick={() => removeLanguage(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0 mb-0.5">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="glass p-8 rounded-[32px] border border-border">
          <h2 className="text-xl font-bold mb-6">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Total Project Reward ($)</label>
              <input type="number" step="0.01" name="price" defaultValue={project.price} required className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none transition-colors" placeholder="e.g. 50" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Pricing Model</label>
              <select name="pricingModel" defaultValue={project.pricingModel} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none">
                <option value="FIXED_PROJECT">Fixed Price</option>
                <option value="PER_HOUR">Per Audio Hour</option>
              </select>
            </div>
          </div>
        </section>

        {/* Target Demographics */}
        <section className="glass p-8 rounded-[32px] border border-border">
          <h2 className="text-xl font-bold mb-6">Requirements</h2>
          
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-bold mb-2">Target Countries</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCountries.map(country => (
                  <span key={country} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold">
                    {country}
                    <button type="button" onClick={() => removeCountry(country)} className="hover:text-primary/70 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={countrySearch}
                  onChange={e => {
                    setCountrySearch(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search and select countries (leave blank for any)"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none transition-colors"
                />
                {showDropdown && countrySearch && filteredCountries.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredCountries.map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => addCountry(country)}
                        className="w-full text-left px-4 py-2 hover:bg-primary/10 transition-colors text-sm"
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:-translate-y-0.5 active:scale-95">
            <Save className="w-5 h-5" /> Save Changes
          </button>
        </div>
      </form>
    </main>
  )
}
