"use client"

import * as React from "react"
import Link from "next/link"
import { Briefcase, MapPin, Users, DollarSign, Filter, CheckCircle, Clock, Send, Loader2 } from "lucide-react"
import { applyToProject } from "@/app/actions/projects"
import { stripHtml } from "@/components/RichTextDisplay"

export function MemberProjectsClient({ initialProjects, isPast }: { initialProjects: any[], isPast: boolean }) {
  const [filterLang, setFilterLang] = React.useState("")
  const [filterCountry, setFilterCountry] = React.useState("")
  const [applying, setApplying] = React.useState<string | null>(null)
  const [appliedIds, setAppliedIds] = React.useState<Record<string, string>>({})

  // Extract unique languages and countries for the dropdowns
  const availableLangs = Array.from(new Set(initialProjects.flatMap(p => p.languages.map((l: any) => l.language))))
  const availableCountries = Array.from(new Set(initialProjects.map(p => p.reqCountry).filter(Boolean)))

  const filteredProjects = initialProjects.filter(p => {
    if (filterLang && !p.languages.some((l: any) => l.language === filterLang)) return false
    if (filterCountry && p.reqCountry !== filterCountry) return false
    return true
  })

  const handleApply = async (projectId: string) => {
    setApplying(projectId)
    try {
      const res = await applyToProject(projectId)
      if (res.success) {
        setAppliedIds(prev => ({ ...prev, [projectId]: "PENDING" }))
      } else {
        alert(res.error || "Failed to apply")
      }
    } catch (e) {
      alert("Something went wrong")
    } finally {
      setApplying(null)
    }
  }

  const getAppStatus = (project: any) => {
    if (appliedIds[project.id]) return appliedIds[project.id]
    return project.myApplication?.status || null
  }

  return (
    <div>
      {/* Filters */}
      {initialProjects.length > 0 && (
        <div className="glass p-4 rounded-xl border border-border mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-foreground/70 font-semibold text-sm">
            <Filter className="w-4 h-4" /> Filter by:
          </div>
          <select 
            value={filterLang} 
            onChange={(e) => setFilterLang(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary transition-colors min-w-[150px]"
          >
            <option value="">All Languages</option>
            {availableLangs.map((lang: any) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select 
            value={filterCountry} 
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary transition-colors min-w-[150px]"
          >
            <option value="">All Countries</option>
            {availableCountries.map((c: any) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          {(filterLang || filterCountry) && (
            <button 
              onClick={() => { setFilterLang(""); setFilterCountry("") }}
              className="text-xs font-bold text-red-400 hover:text-red-500 hover:underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="glass p-16 rounded-2xl border border-border text-center">
          <Briefcase className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Projects Found</h3>
          <p className="text-foreground/60 text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project) => {
            const appStatus = getAppStatus(project)
            const isApplying = applying === project.id

            return (
              <div key={project.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold">{project.title}</h2>
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{stripHtml(project.description)}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.languages.map((lang: any, i: number) => (
                        <span key={i} className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                          {lang.language}{lang.dialect ? ` (${lang.dialect})` : ""} · {lang.proficiency}
                        </span>
                      ))}
                      {project.reqCountry && (() => {
                        let countries: string[] = []
                        try { countries = JSON.parse(project.reqCountry) } catch { countries = [project.reqCountry] }
                        return countries.map((c: string) => (
                          <span key={c} className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {c}
                          </span>
                        ))
                      })()}
                      {project.price && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> ${Number(project.price).toFixed(2)} / {
                            project.pricingModel === "PER_HOUR" ? "Hour" :
                            project.pricingModel === "PER_SENTENCE" ? "Sentence" :
                            "Task"
                          }
                        </span>
                      )}
                      {project.recordingDuration && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-card border border-border text-foreground/75 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-400" /> {project.recordingDuration} {
                            project.durationUnit === "HOUR" ? "Hours" : "Sentences"
                          }
                        </span>
                      )}
                    </div>

                    {project.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {project.images.slice(0, 3).map((img: any) => (
                          <div key={img.id} className="shrink-0">
                            <img src={img.url} alt={img.caption || "Project image"} className="h-20 w-32 object-cover rounded-lg border border-border" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col gap-3 md:min-w-[160px] md:items-end justify-between md:justify-start">
                    <div className="text-right">
                      <p className="text-xs text-foreground/50 font-semibold uppercase">Applicants</p>
                      <p className="font-bold flex items-center gap-1 md:justify-end">
                        <Users className="w-4 h-4 text-foreground/40" /> {project.applicantCount}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/member/projects/${project.id}`}
                        className="px-5 py-2.5 bg-card border border-border text-foreground font-bold text-sm rounded-xl hover:bg-primary/10 hover:border-primary/30 transition-all text-center"
                      >
                        View Details
                      </Link>

                      {/* Apply Button or Status */}
                      {!isPast && (
                        appStatus ? (
                          <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border
                            ${appStatus === "APPROVED" || appStatus === "ACCEPTED" || appStatus === "WORKING" || appStatus === "FINAL_REVIEW" || appStatus === "PAID" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              appStatus === "REJECTED" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }`}
                          >
                            {appStatus === "APPROVED" || appStatus === "ACCEPTED" || appStatus === "WORKING" || appStatus === "FINAL_REVIEW" || appStatus === "PAID" ? (
                              <><CheckCircle className="w-4 h-4" /> Approved</>
                            ) : appStatus === "REJECTED" ? (
                              <>✗ Rejected</>
                            ) : (
                              <><Clock className="w-4 h-4" /> Pending</>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApply(project.id)}
                            disabled={isApplying}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                          >
                            {isApplying ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                            ) : (
                              <><Send className="w-4 h-4" /> Apply Now</>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
