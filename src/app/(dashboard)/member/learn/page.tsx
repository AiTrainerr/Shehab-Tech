import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, BookOpen, ExternalLink, Search } from "lucide-react"

export default async function MemberLearnPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const resources = await prisma.learningResource.findMany({
    orderBy: { createdAt: "desc" }
  })

  // Group by category
  const categories = Array.from(new Set(resources.map(r => r.category || "General")))

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="mb-10">
          <Link href="/member" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" /> Learn Skills
              </h1>
              <p className="text-foreground/70 mt-1">Improve your skills with curated resources selected by our team.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground/60">
              <Search className="w-4 h-4" />
              <span>{resources.length} Resources Available</span>
            </div>
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="glass p-16 rounded-2xl border border-border text-center">
            <BookOpen className="w-16 h-16 text-foreground/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Resources Yet</h3>
            <p className="text-foreground/60">The admin team is preparing learning materials. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(category => {
              const catResources = resources.filter(r => (r.category || "General") === category)
              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-xl font-black">{category}</h2>
                    <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">{catResources.length}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catResources.map((r) => (
                      <a
                        key={r.id}
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="glass rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all group flex flex-col"
                      >
                        {r.imageUrl ? (
                          <div className="relative overflow-hidden h-48">
                            <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-xl">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-b border-border relative">
                            <BookOpen className="w-10 h-10 text-primary/40" />
                            <div className="absolute top-3 right-3 p-2 bg-card border border-border rounded-xl">
                              <ExternalLink className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-black text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{r.title}</h3>
                          {r.description && (
                            <p className="text-sm text-foreground/60 leading-relaxed flex-1">{r.description}</p>
                          )}
                          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-foreground/40">{new Date(r.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                              Open Resource <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
