import { prisma } from "@/lib/prisma"
import { PublicProjectsClient } from "./PublicProjectsClient"

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  // Fetch only OPEN or IN_PROGRESS projects
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] }
    },
    include: {
      languages: true,
      _count: { select: { applications: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Format the project records
  const formattedProjects = projects.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    reqCountry: p.reqCountry,
    createdAt: p.createdAt.toISOString(),
    languages: p.languages.map(l => ({
      language: l.language,
      dialect: l.dialect,
      proficiency: l.proficiency
    })),
    applicationsCount: p._count.applications,
    recordingDuration: p.recordingDuration,
    durationUnit: p.durationUnit,
    pricingModel: p.pricingModel,
    executionOption: p.executionOption
  }))

  return <PublicProjectsClient initialProjects={formattedProjects} />
}
