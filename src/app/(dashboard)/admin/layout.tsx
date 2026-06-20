import * as React from "react"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin-sidebar"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isApproved: true, canReviewQC: true, canApproveApplications: true }
  })

  if (!currentUser || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(currentUser.role)) {
    redirect("/member")
  }

  if (currentUser.role === "MODERATOR" && !currentUser.isApproved) {
    redirect("/login")
  }

  const pendingVerifications = await prisma.user.count({ where: { verificationStatus: "PENDING" } })

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar 
        pendingVerifications={pendingVerifications} 
        userRole={currentUser.role}
        canReviewQC={currentUser.canReviewQC}
        canApproveApplications={currentUser.canApproveApplications}
      />
      <div className="flex-1 w-full lg:pl-64 overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
