import * as React from "react"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { Star, CheckCircle, MapPin, Briefcase, Award, Shield, XCircle, FileImage } from "lucide-react"
import { approveVerification, rejectVerification } from "@/app/actions/verification"
import { revalidatePath } from "next/cache"

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const cookieStore = await cookies()
  const viewerRole = cookieStore.get("userRole")?.value

  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true } },
      languages: true,
      portfolios: true
    }
  })

  if (!user) notFound()

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -z-10" />

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Profile Card */}
        <div className="glass rounded-3xl p-8 sm:p-12 border border-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="shrink-0 relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-xl" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center text-4xl font-black text-primary">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              {user.verificationStatus === "VERIFIED" && (
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-green-500 fill-green-500/20" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h1 className="text-4xl font-black text-foreground">{user.firstName} {user.lastName}</h1>
                <p className="text-lg text-foreground/60 font-medium mt-1">{user.ranking} Freelancer</p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-semibold">
                {user.country && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-foreground/70">
                    <MapPin className="w-4 h-4 text-blue-400" /> {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-foreground/70">
                  <Briefcase className="w-4 h-4 text-primary" /> {user.completedCount} Jobs Completed
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
                  <Star className="w-4 h-4 fill-yellow-500" /> {user.rating.toFixed(1)} Rating
                </span>
              </div>
            </div>
          </div>
          
          {user.bio && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <h3 className="text-lg font-bold mb-3">About Me</h3>
              <p className="text-foreground/80 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Project Types & Languages */}
          <div className="mt-8 flex flex-col md:flex-row gap-8 border-t border-border pt-6">
            {user.projectTypes && user.projectTypes.length > 0 && (
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-3">Looking to work on</h3>
                <div className="flex flex-wrap gap-2">
                  {user.projectTypes.map((pt, i) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold">
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {user.languages && user.languages.length > 0 && (
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-3">Languages Spoken</h3>
                <div className="flex flex-wrap gap-2">
                  {user.languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1 bg-foreground/5 text-foreground border border-border rounded-lg text-sm font-semibold flex items-center gap-2">
                      {lang.language} <span className="opacity-50 text-xs">| {lang.proficiency}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {user.skills.length > 0 && (
          <div className="glass rounded-3xl p-8 border border-border">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-primary" /> Verified Skills
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.skills.map(us => (
                <span key={us.skill.id} className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary font-bold rounded-xl">
                  {us.skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolios */}
        {user.portfolios.length > 0 && (
          <div className="glass rounded-3xl p-8 border border-border">
            <h3 className="text-2xl font-bold mb-6">Portfolio Projects</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {user.portfolios.map(port => (
                <div key={port.id} className="bg-background rounded-2xl overflow-hidden border border-border">
                  {port.imageUrl && (
                    <img src={port.imageUrl} alt={port.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5">
                    <h4 className="font-bold text-lg mb-2">{port.title}</h4>
                    {port.description && <p className="text-sm text-foreground/70 mb-4">{port.description}</p>}
                    {port.fileUrl && (
                      <a href={port.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline">
                        View Attached File →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {viewerRole === "ADMIN" && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="glass rounded-3xl p-8 border-2 border-orange-500/20 bg-orange-500/5 relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-500">
              <Shield className="w-6 h-6" /> Admin Controls (Verification)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Documents */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground/80">Submitted Documents</h4>
                {user.idCardUrl || user.selfieUrl ? (
                  <div className="flex gap-4">
                    {user.idCardUrl && (
                      <a href={user.idCardUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold hover:border-primary transition-colors">
                        <FileImage className="w-4 h-4" /> View ID Card
                      </a>
                    )}
                    {user.selfieUrl && (
                      <a href={user.selfieUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold hover:border-primary transition-colors">
                        <FileImage className="w-4 h-4" /> View Selfie
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/50 italic">No verification documents uploaded.</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground/80">Verification Status: <span className="font-black text-foreground">{user.verificationStatus}</span></h4>
                <div className="flex gap-4">
                  {user.verificationStatus !== "VERIFIED" && (
                    <form action={async () => {
                      "use server"
                      await approveVerification(user.id)
                      revalidatePath(`/profile/${user.id}`)
                    }}>
                      <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold rounded-xl transition-colors border border-green-500/20 shadow-sm">
                        <CheckCircle className="w-5 h-5" /> Approve Account
                      </button>
                    </form>
                  )}
                  {user.verificationStatus !== "REJECTED" && (
                    <form action={async () => {
                      "use server"
                      await rejectVerification(user.id)
                      revalidatePath(`/profile/${user.id}`)
                    }}>
                      <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors border border-red-500/20 shadow-sm">
                        <XCircle className="w-5 h-5" /> Reject Account
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
