import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { ArrowLeft, Briefcase } from "lucide-react"
import { MemberProjectsClient } from "./MemberProjectsClient"
import { redirect } from "next/navigation"

export default async function MemberProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }> 
}) {
  const { filter } = await searchParams
  const isPast = filter === "past"

  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  let projects: any[] = []
  try {
    const statuses = isPast ? ["COMPLETED"] : ["OPEN"]
    const projectsData = await prisma.project.findMany({
      where: { status: { in: statuses } },
      orderBy: { createdAt: "desc" },
      include: {
        languages: true,
        images: true,
        _count: { select: { applications: true } },
        applications: {
          where: { userId },
          select: { status: true }
        }
      }
    })

    projects = projectsData.map((project) => ({
      ...project,
      applicantCount: project._count.applications,
      myApplication: project.applications[0] || null
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
