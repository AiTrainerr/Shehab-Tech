import * as React from "react"
import { prisma } from "@/lib/prisma"
import { ShieldCheck } from "lucide-react"
import { AdminQAClient } from "./AdminQAClient"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminQAManagementPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, moderatorType: true, assignedProjects: { select: { id: true, title: true } } }
  })

  if (!currentUser || (currentUser.role !== "MODERATOR" && currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
    redirect("/admin")
  }

  let qaWhereClause: any = { role: "MODERATOR", moderatorType: "QA" }
  
  if (currentUser.role === "MODERATOR") {
    if (currentUser.moderatorType === "OUTSOURCED") {
      qaWhereClause.teamLeaderId = currentUser.id
    } else {
      // Internal Platform Admin assigns internal QA
      qaWhereClause.teamLeaderId = null
    }
    // Also, they can only see QAs assigned to their projects
    const assignedIds = currentUser.assignedProjects.map(p => p.id)
    if (assignedIds.length > 0) {
      qaWhereClause.assignedProjects = { some: { id: { in: assignedIds } } }
    } else {
      qaWhereClause.id = "none" // Force empty if no projects
    }
  }

  const qas = await prisma.user.findMany({
    where: qaWhereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      assignedProjects: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Only show projects the current user is assigned to
  const availableProjects = currentUser.role === "MODERATOR" 
    ? currentUser.assignedProjects 
    : await prisma.project.findMany({ select: { id: true, title: true } })

  // Filter QA's assigned projects so it only shows projects the current moderator manages
  const filteredQAs = qas.map(qa => ({
    ...qa,
    assignedProjects: qa.assignedProjects.filter(p => availableProjects.some(ap => ap.id === p.id))
  }))

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            QA Management
          </h1>
          <p className="text-foreground/70">Assign and manage Quality Assurance personnel for your projects.</p>
        </div>
      </div>

      <AdminQAClient projects={availableProjects} qas={filteredQAs} />
    </main>
  )
}
