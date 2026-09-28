import * as React from "react"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin-sidebar"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(currentUser.role)) {
    redirect("/member")
  }

  if (currentUser.role === "MODERATOR" && !currentUser.isApproved) {
    redirect("/api/auth/logout?reason=pending_approval")
  }

  const pendingVerifications = await prisma.user.count({ where: { verificationStatus: "PENDING" } })

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar 
        pendingVerifications={pendingVerifications} 
        userRole={currentUser.role}
        canReviewQC={currentUser.canReviewQC}
        canApproveApplications={currentUser.canApproveApplications}
        moderatorType={currentUser.moderatorType}
      />
      <div className="flex-1 w-full lg:pl-64 overflow-x-hidden pb-20 lg:pb-0">
        {children}
      </div>
    </div>
  )
}
