import * as React from "react"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pendingVerifications = await prisma.user.count({ where: { verificationStatus: "PENDING" } })

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar pendingVerifications={pendingVerifications} />
      <div className="flex-1 w-full lg:pl-64 overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
