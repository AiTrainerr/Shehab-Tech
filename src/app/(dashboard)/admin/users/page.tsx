import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Users, Mail, Phone, MapPin, CheckCircle, Clock, XCircle, Shield } from "lucide-react"
import { AdminRatingForm } from "@/components/admin-rating-form"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER" },
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

        {users.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-border text-center">
            <Users className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60 font-semibold">No members registered yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              const status = statusConfig[user.verificationStatus as keyof typeof statusConfig] || statusConfig.PENDING
              return (
                <div key={user.id} className="glass p-6 rounded-2xl border border-border hover:border-primary/20 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Avatar + Name */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-black text-primary">
                        {user.firstName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{user.firstName} {user.lastName}</h3>
                          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-card rounded-full border border-border text-foreground/60">
                            {user.ranking}
                          </span>
                        </div>

                        {/* Sensitive Info — Admin Only */}
                        <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mt-2">
                          <span className="flex items-center gap-1.5 bg-yellow-500/5 border border-yellow-500/10 px-2 py-1 rounded-lg">
                            <Mail className="w-3.5 h-3.5 text-yellow-500" />
                            <a href={`mailto:${user.email}`} className="hover:text-primary transition-colors">{user.email}</a>
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1.5 bg-yellow-500/5 border border-yellow-500/10 px-2 py-1 rounded-lg">
                              <Phone className="w-3.5 h-3.5 text-yellow-500" />
                              <a href={`tel:${user.phone}`} className="hover:text-primary transition-colors">{user.phone}</a>
                            </span>
                          )}
                          {user.country && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> {user.country}
                            </span>
                          )}
                          {user.age && <span>{user.age} yrs</span>}
                          {user.gender && <span className="capitalize">{user.gender}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 lg:text-right lg:min-w-[140px] text-sm">
                      <div>
                        <p className="text-xs text-foreground/50 uppercase font-semibold">Completed</p>
                        <p className="font-black text-xl">{user.completedCount}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-foreground/50 uppercase font-semibold mb-1">Set Rating</p>
                        <AdminRatingForm userId={user.id} currentRating={user.rating} />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/50 uppercase font-semibold">Applications</p>
                        <p className="font-black text-xl">{user._count.applications}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
