import * as React from "react"
import Link from "next/link"
import { FileText, Plus, Users, Clock, Edit2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { AdminProjectsClient } from "./AdminProjectsClient"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminProjectsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, assignedProjectId: true }
  })

  const whereClause = currentUser?.role === "MODERATOR"
    ? { id: currentUser.assignedProjectId || "none" }
    : {}

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
      applications: {
        where: { status: "ACCEPTED" }, // Or whatever status means "working on it"
        include: { user: { select: { firstName: true, lastName: true } } }
      }
    }
  })

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3"><FileText className="w-8 h-8 text-primary"/> Manage Projects</h1>
            <p className="text-foreground/70">View and edit all platform projects.</p>
          </div>
          <Link href="/admin/projects/create" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <Plus className="w-5 h-5" /> Create Project
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="glass p-16 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-foreground/20 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Projects Found</h3>
            <p className="text-foreground/60 mb-6">You haven't published any projects yet.</p>
            <Link href="/admin/projects/create" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all">
              Create Your First Project
            </Link>
          </div>
        ) : (
          <AdminProjectsClient initialProjects={projects} />
        )}
      </div>
    </main>
  )
}
