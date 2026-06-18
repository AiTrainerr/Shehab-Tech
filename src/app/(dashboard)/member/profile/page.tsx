import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { 
  User, Mail, Phone, MapPin, Calendar, Star, 
  Briefcase, CheckCircle, Clock, Edit2, Shield, 
  Camera, ArrowLeft
} from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload"
import { ShareProfileButton } from "@/components/share-profile-button"

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { portfolios: true }
  })

  if (!user) redirect("/login")

  const verificationColor = {
    VERIFIED: "text-green-500 bg-green-500/10 border-green-500/20",
    PENDING: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    REJECTED: "text-red-500 bg-red-500/10 border-red-500/20",
    NOT_VERIFIED: "text-foreground/50 bg-foreground/5 border-foreground/10",
  }[user.verificationStatus] || "text-foreground/50 bg-foreground/5 border-foreground/10"

  const rankColors: Record<string, string> = {
    BEGINNER: "text-gray-400 bg-gray-400/10",
    INTERMEDIATE: "text-blue-400 bg-blue-400/10",
    VERIFIED: "text-green-400 bg-green-400/10",
    EXPERT: "text-purple-400 bg-purple-400/10",
    PREMIUM: "text-yellow-400 bg-yellow-400/10",
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Back */}
        <Link href="/member" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header Card */}
        <div className="glass rounded-3xl border border-border p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
            
            {/* Avatar */}
            <ProfileAvatarUpload initialAvatar={user.avatarUrl} />

            {/* Name & Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-black text-foreground">
                  {user.firstName} {user.middleName ? user.middleName + " " : ""}{user.lastName}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${verificationColor}`}>
                  {user.verificationStatus === "VERIFIED" ? "✓ Verified" : 
                   user.verificationStatus === "PENDING" ? "⏳ Pending Review" : 
                   user.verificationStatus === "REJECTED" ? "✗ Rejected" : "○ Not Verified"}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rankColors[user.ranking] || ""}`}>
                  {user.ranking}
                </span>
              </div>
              <p className="text-foreground/60 mb-3">{user.bio || "No bio added yet."}</p>
              <div className="flex flex-wrap gap-4 text-sm text-foreground/70">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user.email}</span>
                {user.country && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{user.country}</span>}
                {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{user.phone}</span>}
                {user.age && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{user.age} years old</span>}
              </div>
            </div>

            {/* Edit & Share */}
            <div className="flex flex-col gap-3 shrink-0">
              <Link href="/member/profile/edit" className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-xl text-sm font-bold hover:bg-card transition-colors">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </Link>
              <ShareProfileButton userId={user.id} />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Completed Tasks", value: user.completedCount, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500 bg-green-500/10" },
            { label: "Rating", value: `${user.rating.toFixed(1)} ★`, icon: <Star className="w-5 h-5" />, color: "text-yellow-500 bg-yellow-500/10" },
            { label: "Portfolio Items", value: user.portfolios.length, icon: <Briefcase className="w-5 h-5" />, color: "text-blue-500 bg-blue-500/10" },
            { label: "Member Since", value: new Date(user.createdAt).getFullYear(), icon: <Clock className="w-5 h-5" />, color: "text-purple-500 bg-purple-500/10" },
          ].map((stat, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-border flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Verification Status */}
          <div className="glass p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Verification
            </h2>
            {user.verificationStatus === "VERIFIED" ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-green-500">Account Verified!</p>
                <p className="text-sm text-foreground/60 mt-1">You can now withdraw your earnings.</p>
              </div>
            ) : user.verificationStatus === "PENDING" ? (
              <div className="text-center py-4">
                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <p className="font-bold text-yellow-500">Under Review</p>
                <p className="text-sm text-foreground/60 mt-1">Admin is reviewing your documents.</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-foreground/60 mb-4">Upload your ID and Selfie to get verified and unlock withdrawals.</p>
                <Link href="/member/verification" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Verify Now
                </Link>
              </div>
            )}
          </div>

          {/* Portfolio Section */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Portfolio
              </h2>
              <Link href="/member/portfolio/add" className="text-sm font-bold text-primary hover:underline">+ Add Item</Link>
            </div>
            {user.portfolios.length === 0 ? (
              <div className="text-center py-8 text-foreground/50">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No portfolio items yet.</p>
                <p className="text-sm mt-1">Showcase your work to attract better projects.</p>
                <Link href="/member/portfolio/add" className="inline-block mt-4 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors">
                  Add Your First Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {user.portfolios.slice(0, 4).map((p) => (
                  <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-full h-24 object-cover" />}
                    <div className="p-3">
                      <p className="font-bold text-sm truncate">{p.title}</p>
                      {p.description && <p className="text-xs text-foreground/60 truncate">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
