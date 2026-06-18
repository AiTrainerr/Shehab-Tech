import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Briefcase, Plus, ImageIcon, FileText, BadgeCheck } from "lucide-react"

export default async function PortfolioPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  const userRole = cookieStore.get("userRole")?.value
  if (!userId) redirect("/login")

  // All portfolio items from all users — visible to everyone
  const portfolios = await prisma.portfolio.findMany({
    include: { user: { select: { firstName: true, lastName: true, role: true, verificationStatus: true } } },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href={userRole === "ADMIN" ? "/admin" : "/member"} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary" /> Member Portfolios
            </h1>
            <p className="text-foreground/70">Browse work samples from all members.</p>
          </div>
          {userRole !== "ADMIN" && (
            <Link href="/member/portfolio/add" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Item
            </Link>
          )}
        </div>

        {portfolios.length === 0 ? (
          <div className="glass p-16 rounded-2xl border border-border text-center">
            <Briefcase className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Portfolio Items Yet</h3>
            <p className="text-foreground/60 mb-6">Be the first to showcase your work!</p>
            {userRole !== "ADMIN" && (
              <Link href="/member/portfolio/add" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Add Your First Item
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((item) => (
              <div key={item.id} className="glass rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-primary/5 flex items-center justify-center border-b border-border">
                    <ImageIcon className="w-8 h-8 text-primary/30" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                    {item.user.verificationStatus === "VERIFIED" && (
                      <BadgeCheck className="shrink-0 w-5 h-5 text-white fill-green-500" />
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-foreground/70 leading-relaxed mb-4 flex-1">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground/60">
                      {item.user.firstName} {item.user.lastName}
                    </span>
                    <span className="text-xs text-foreground/40">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
