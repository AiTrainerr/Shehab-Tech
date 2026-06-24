"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X, Briefcase, User, ChevronRight, Loader2 } from "lucide-react"

interface SearchResult {
  type: "project" | "user"
  id: string
  title: string
  subtitle?: string
  href: string
}

interface GlobalSearchProps {
  isAdmin?: boolean
}

export function GlobalSearch({ isAdmin = false }: GlobalSearchProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Focus input when opened
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(""); setResults([]) }
  }, [open])

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&admin=${isAdmin}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, isAdmin])

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setOpen(false)
  }

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground/50 bg-card/50 border border-border rounded-lg hover:border-primary/40 hover:text-foreground transition-all group"
        title="Global Search (Ctrl+K)"
        aria-label="Open search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-border rounded opacity-60 group-hover:opacity-100 transition-opacity">
          Ctrl K
        </kbd>
      </button>

      {/* Search Overlay */}
      {open && (
        <div className="search-overlay" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xl mx-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="relative glass rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
                {loading ? (
                  <Loader2 className="w-5 h-5 text-foreground/40 animate-spin shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-foreground/40 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search for projects or users..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-foreground/40 text-sm"
                  id="global-search-input"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="p-1 hover:bg-border rounded-md transition-colors">
                    <X className="w-4 h-4 text-foreground/40" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-xs text-foreground/40 hover:text-foreground border border-border px-2 py-0.5 rounded transition-colors">
                  Esc
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!query.trim() && (
                  <div className="px-4 py-8 text-center text-sm text-foreground/40">
                    Type to search for projects or users
                  </div>
                )}

                {query.trim() && !loading && results.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-foreground/40">
                    No results found for &quot;{query}&quot;
                  </div>
                )}

                {results.length > 0 && (
                  <div className="p-2">
                    {results.map((result, i) => (
                      <button
                        key={result.id + i}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 hover:border hover:border-primary/20 transition-all text-left group"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className={`p-2 rounded-lg ${result.type === "project" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"}`}>
                          {result.type === "project" ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold text-foreground truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-foreground/50 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-foreground/30">
                <span>↑↓ Navigate</span>
                <span>Enter to open</span>
                <span>Esc to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
