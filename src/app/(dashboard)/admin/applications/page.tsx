import { prisma } from "@/lib/prisma"
import { Users, Filter } from "lucide-react"
import { AdminApplicationsClient } from "./AdminApplicationsClient"

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    where: {
      status: { in: ["PENDING", "APPROVED", "REJECTED"] }
    },
    include: {
      project: { select: { id: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true, ranking: true, verificationStatus: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Project Applications
        </h1>
        <p className="text-foreground/70">Review freelancer applications and manage approvals.</p>
      </div>

      <AdminApplicationsClient applications={applications} />
    </div>
  )
}
