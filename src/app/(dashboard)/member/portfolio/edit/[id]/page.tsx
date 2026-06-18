import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Image as ImageIcon } from "lucide-react"
import EditPortfolioForm from "./EditPortfolioForm"

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    redirect("/login")
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id }
  })

  if (!portfolio || portfolio.userId !== userId) {
    redirect("/member/profile")
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto w-full">
        <Link href="/member/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-primary" /> Edit Portfolio Item
        </h1>
        <p className="text-foreground/70 mb-8">Update your portfolio details or replace the image.</p>

        <EditPortfolioForm portfolio={portfolio} />
      </div>
    </div>
  )
}
