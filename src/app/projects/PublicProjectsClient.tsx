"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Briefcase, Globe2, Users, ArrowRight, MapPin } from "lucide-react"

interface FormattedProject {
  id: string
  title: string
  description: string
  price: number | null
  reqCountry: string | null
  createdAt: string
  languages: { language: string; dialect: string | null; proficiency: string | null }[]
  applicationsCount: number
  recordingDuration: number | null
  durationUnit: string
  pricingModel: string
  executionOption: string
  targetMales: number
  targetFemales: number
  currentMales: number
  currentFemales: number
}

interface Props {
  initialProjects: FormattedProject[]
}

export function PublicProjectsClient({ initialProjects }: Props) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([])
  const [locationOption, setLocationOption] = React.useState<"any" | "specific">("any")
  const [sortBy, setSortBy] = React.useState<"newest" | "highest_paid">("newest")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const categories = [
    { label: "Audio Collection", keywords: ["voice", "audio", "recording", "sound", "speak", "mic", "talk"] },
    { label: "Image Annotation", keywords: ["image", "photo", "picture", "camera", "label"] },
    { label: "Text Translation", keywords: ["text", "translation", "transcribe", "translate", "write"] }
  ]

  const uniqueLanguages = Array.from(
    new Set(initialProjects.flatMap(p => p.languages.map(l => l.language)))
  )

  const handleCategoryChange = (label: string) => {
    setSelectedCategories(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    )
    setCurrentPage(1)
  }

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
    setCurrentPage(1)
  }

  // Filter logic
  const filtered = initialProjects.filter(p => {
    // 1. Search term
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.languages.some(l => l.language.toLowerCase().includes(term))

    if (!matchesSearch) return false

    // 2. Categories
    if (selectedCategories.length > 0) {
      const matchesCategory = selectedCategories.some(catLabel => {
        const cat = categories.find(c => c.label === catLabel)
        if (!cat) return false
        return cat.keywords.some(kw =>
          p.title.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
        )
      })
      if (!matchesCategory) return false
    }

    // 3. Languages
    if (selectedLanguages.length > 0) {
      const matchesLang = p.languages.some(l => selectedLanguages.includes(l.language))
      if (!matchesLang) return false
    }

    // 4. Location
    if (locationOption === "specific" && !p.reqCountry) {
      return false
    }

    return true
  })

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "highest_paid") {
      return (b.price || 0) - (a.price || 0)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Pagination logic
  const totalPages = Math.ceil(sorted.length / itemsPerPage)
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="min-h-screen pt-20 pb-24 text-foreground bg-background">
      {/* Header & Search */}
      <div className="bg-card border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-foreground mb-4">Find Work</h1>
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl">
            Browse through active AI collection and review tasks on shehab-tech and start earning.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="text" 
                placeholder="Search projects by keyword, skill, or language..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="px-6 py-4 bg-background border border-border rounded-xl font-semibold hover:bg-card transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <aside className="hidden lg:block space-y-8">
            <div>
              <h3 className="font-bold mb-4 text-foreground">Category</h3>
              <div className="space-y-3">
                {categories.map(c => (
                  <label key={c.label} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(c.label)}
                      onChange={() => handleCategoryChange(c.label)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary" 
                    />
                    <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {uniqueLanguages.length > 0 && (
              <div>
                <h3 className="font-bold mb-4 text-foreground">Language</h3>
                <div className="space-y-3">
                  {uniqueLanguages.map(lang => (
                    <label key={lang} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedLanguages.includes(lang)}
                        onChange={() => handleLanguageChange(lang)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary" 
                      />
                      <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold mb-4 text-foreground">Location Requirement</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="loc" 
                    checked={locationOption === "any"}
                    onChange={() => { setLocationOption("any"); setCurrentPage(1); }}
                    className="w-4 h-4 text-primary focus:ring-primary border-border" 
                  />
                  <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">Anywhere</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="loc" 
                    checked={locationOption === "specific"}
                    onChange={() => { setLocationOption("specific"); setCurrentPage(1); }}
                    className="w-4 h-4 text-primary focus:ring-primary border-border" 
                  />
                  <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">Specific Country</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Project Listings */}
          <main className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold text-foreground/70">
                Showing {sorted.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} projects
              </span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-primary"
              >
                <option value="newest">Newest First</option>
                <option value="highest_paid">Highest Paid</option>
              </select>
            </div>

            {paginated.map((p) => {
              // Parse countries list
              let countryLabel = "Anywhere"
              if (p.reqCountry) {
                try {
                  const arr = JSON.parse(p.reqCountry)
                  countryLabel = Array.isArray(arr) ? arr.join(", ") : p.reqCountry
                } catch {
                  countryLabel = p.reqCountry
                }
              }

              return (
                <div key={p.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl group">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase tracking-wider">
                          Active
                        </span>
                        {p.executionOption === "EXTERNAL" && (
                          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-md uppercase tracking-wider">
                            External Link
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {p.title}
                      </h2>
                      <p className="text-foreground/70 text-sm mb-6 leading-relaxed max-w-3xl line-clamp-2">
                        {p.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 sm:gap-6 text-sm font-medium text-foreground/60">
                        {p.languages.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Globe2 className="w-4 h-4 text-primary" /> {p.languages.map(l => l.language).join(", ")}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-orange-400" /> {countryLabel}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-purple-400" /> {p.applicationsCount} Total Applied
                          </div>
                          {(p.targetMales > 0 || p.targetFemales > 0) && (
                            <div className="flex items-center gap-3 text-xs mt-1 border-l-2 border-border pl-2">
                              {p.targetMales > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  <span>Males: {p.currentMales} / {p.targetMales} ({Math.max(0, p.targetMales - p.currentMales)} left)</span>
                                </div>
                              )}
                              {p.targetFemales > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                  <span>Females: {p.currentFemales} / {p.targetFemales} ({Math.max(0, p.targetFemales - p.currentFemales)} left)</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {p.recordingDuration && (
                          <div className="flex items-center gap-1.5 mt-auto">
                            <Briefcase className="w-4 h-4 text-teal-400" /> {p.recordingDuration} {p.durationUnit === "HOUR" ? "Hours" : "Sentences"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                      <div className="md:text-right mb-4">
                        <div className="text-2xl font-black text-foreground">${p.price ? Number(p.price).toFixed(2) : "0.00"}</div>
                        <div className="text-xs text-foreground/50 uppercase tracking-wider font-bold mt-1">
                          {p.pricingModel === "PER_HOUR" ? "Per Hour" :
                           p.pricingModel === "PER_SENTENCE" ? "Per Sentence" : "Task payout"}
                        </div>
                      </div>
                      <Link 
                        href={`/projects/${p.id}`} 
                        className="w-full md:w-auto px-6 py-3 bg-card border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary text-center rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        Apply Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                  </div>
                </div>
              )
            })}

            {paginated.length === 0 && (
              <div className="text-center py-12 glass rounded-2xl border border-border text-foreground/50">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p>No projects found matching your filters.</p>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-card disabled:opacity-50"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${
                      currentPage === idx + 1 
                        ? "bg-primary text-primary-foreground" 
                        : "border border-border hover:bg-card font-medium"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-card disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            )}
            
          </main>
        </div>
      </div>
    </div>
  )
}
