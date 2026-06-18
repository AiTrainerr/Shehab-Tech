"use client"

import * as React from "react"
import Link from "next/link"
import { Briefcase, MapPin, Users, DollarSign, Filter } from "lucide-react"

export function MemberProjectsClient({ initialProjects, isPast }: { initialProjects: any[], isPast: boolean }) {
  const [filterLang, setFilterLang] = React.useState("")
  const [filterCountry, setFilterCountry] = React.useState("")

  // Extract unique languages and countries for the dropdowns
  const availableLangs = Array.from(new Set(initialProjects.flatMap(p => p.languages.map((l: any) => l.language))))
  const availableCountries = Array.from(new Set(initialProjects.map(p => p.reqCountry).filter(Boolean)))

  const filteredProjects = initialProjects.filter(p => {
    if (filterLang && !p.languages.some((l: any) => l.language === filterLang)) return false
    if (filterCountry && p.reqCountry !== filterCountry) return false
    return true
  })

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
          {filteredProjects.map((project) => (
            <div key={project.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold">{project.title}</h2>
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.languages.map((lang: any, i: number) => (
                      <span key={i} className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                        {lang.language}{lang.dialect ? ` (${lang.dialect})` : ""} · {lang.proficiency}
                      </span>
                    ))}
                    {project.reqCountry && (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {project.reqCountry}
                      </span>
                    )}
                    {project.price && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> ${Number(project.price).toFixed(2)}
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

                <div className="flex md:flex-col gap-4 md:min-w-[140px] md:text-right">
                  <div>
                    <p className="text-xs text-foreground/50 font-semibold uppercase">Applicants</p>
                    <p className="font-bold flex items-center gap-1 md:justify-end">
                      <Users className="w-4 h-4 text-foreground/40" /> {project.applicantCount}
                    </p>
                  </div>
                  <Link href={`/member/projects/${project.id}`} className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all text-center">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
