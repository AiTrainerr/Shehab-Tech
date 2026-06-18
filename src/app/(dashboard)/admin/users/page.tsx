import { prisma } from "@/lib/prisma"
import { Users, Shield, CheckCircle, Clock, XCircle } from "lucide-react"
import { AdminUsersClient } from "./AdminUsersClient"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,        // Only shown here (admin page)
      phone: true,        // Only shown here (admin page)
      whatsapp: true,     // Only shown here (admin page)
      country: true,
      gender: true,
      age: true,
      ranking: true,
      completedCount: true,
      rating: true,
      verificationStatus: true,
      createdAt: true,
      _count: { select: { applications: true, portfolios: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  const statusConfig = {
    VERIFIED:  { label: "Verified",  icon: <CheckCircle className="w-4 h-4" />, cls: "text-green-500 bg-green-500/10 border-green-500/20" },
    PENDING:   { label: "Pending",   icon: <Clock className="w-4 h-4" />,       cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
    REJECTED:  { label: "Rejected",  icon: <XCircle className="w-4 h-4" />,     cls: "text-red-500 bg-red-500/10 border-red-500/20" },
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" /> Members ({users.length})
            </h1>
            <p className="text-foreground/70">All registered freelancers. Sensitive info (email, phone) is only visible here.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Shield className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-500">Admin Only View</span>
          </div>
        </div>

        <AdminUsersClient initialUsers={users} statusConfig={statusConfig} />
      </div>
    </main>
  )
}
