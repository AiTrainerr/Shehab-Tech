import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Briefcase, MapPin, Users, Clock, DollarSign } from "lucide-react"

export default async function MemberProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }> 
}) {
  const { filter } = await searchParams
  const isPast = filter === "past"

  // We use queryRaw for everything because the Prisma Client is out of sync and contains deleted fields like 'imageUrl'
  let projects: any[] = []
  try {
    const statusFilter = isPast ? "('COMPLETED', 'CANCELLED')" : "('OPEN')"
    const projectsData: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM Project 
      WHERE status IN ${statusFilter}
      ORDER BY createdAt DESC
    `)

    projects = await Promise.all(projectsData.map(async (project) => {
      try {
        const languages: any[] = await prisma.$queryRaw`SELECT * FROM ProjectLanguage WHERE projectId = ${project.id}`
        const images: any[] = await prisma.$queryRaw`SELECT * FROM ProjectImage WHERE projectId = ${project.id}`
        const appCount: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Application WHERE projectId = ${project.id}`
        
        return {
          ...project,
          languages: languages || [],
          images: images || [],
          applicantCount: Number(appCount[0]?.count || 0)
        }
      } catch (e) {
        return { ...project, languages: [], images: [], applicantCount: 0 }
      }
    }))
  } catch (e) {
    console.error("Projects fetch error:", e)
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/member" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" /> 
            {isPast ? "Past Projects" : "Available Projects"}
          </h1>
        </div>

        {projects.length === 0 ? (
          <div className="glass p-16 rounded-2xl border border-border text-center">
            <Briefcase className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Projects Found</h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
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
    </div>
  )
}
