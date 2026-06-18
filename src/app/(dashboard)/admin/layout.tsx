import * as React from "react"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pendingVerifications = await prisma.user.count({ where: { verificationStatus: "PENDING" } })

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar pendingVerifications={pendingVerifications} />
      <div className="flex-1 w-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}
