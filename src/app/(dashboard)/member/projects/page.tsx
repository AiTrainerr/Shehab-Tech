import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Briefcase } from "lucide-react"
import { MemberProjectsClient } from "./MemberProjectsClient"

export default async function MemberProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }> 
}) {
  const { filter } = await searchParams
  const isPast = filter === "past"

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

        <MemberProjectsClient initialProjects={projects} isPast={isPast} />
      </div>
    </div>
  )
}
