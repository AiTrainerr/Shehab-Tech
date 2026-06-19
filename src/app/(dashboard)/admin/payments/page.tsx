import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DollarSign } from "lucide-react"
import { AdminPaymentsClient } from "./AdminPaymentsClient"

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  // Fetch approved applications (pending payout) and paid applications (payout history)
  const applications = await prisma.application.findMany({
    where: {
      status: { in: ["APPROVED", "PAID"] }
    },
    include: {
      project: {
        select: { id: true, title: true, price: true }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          paymentMethod: true,
          paymentId: true,
          paymentEmail: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  })

  const pendingPayments = applications.filter(app => app.status === "APPROVED")
  const paidPayments = applications.filter(app => app.status === "PAID")

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" /> Payments Overview
        </h1>
        <p className="text-foreground/70">Manage payouts for freelancers and track history.</p>
      </div>

      <AdminPaymentsClient 
        pendingPayments={pendingPayments}
        paidPayments={paidPayments}
      />
    </main>
  )
}
