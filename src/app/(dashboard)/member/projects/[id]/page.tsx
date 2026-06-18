import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ArrowLeft, MapPin, Users, Clock, CheckCircle, AlertCircle, MessageCircle, Send, DollarSign } from "lucide-react"
import { applyToProject } from "@/app/actions/projects"
import { CommentsSection } from "@/components/comments-section"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  // Use raw query for project too
  let project: any = null
  try {
    const projects: any[] = await prisma.$queryRaw`SELECT * FROM Project WHERE id = ${id}`
    project = projects[0]
  } catch (e) {
    console.error(e)
  }

  if (!project) redirect("/member/projects")

  // Fetch relations using raw queries
  let languages: any[] = []
  let images: any[] = []
  let comments: any[] = []
  let applicantCount = 0
  
  try {
    languages = await prisma.$queryRaw`SELECT * FROM ProjectLanguage WHERE projectId = ${id}`
    images = await prisma.$queryRaw`SELECT * FROM ProjectImage WHERE projectId = ${id}`
    
    // Comments with author info
    const rawComments = await prisma.comment.findMany({
      where: { projectId: id },
      include: { author: { select: { id: true, firstName: true, lastName: true, verificationStatus: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: "asc" }
    })
    
    // Map to expected format
    comments = rawComments.map(c => ({
      ...c,
      author: {
        id: c.author.id,
        firstName: c.author.firstName,
        lastName: c.author.lastName,
        verificationStatus: c.author.verificationStatus,
        avatarUrl: c.author.avatarUrl,
        role: c.author.role
      }
    }))
    
    const appCount: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Application WHERE projectId = ${id}`
    applicantCount = Number(appCount[0]?.count || 0)
  } catch (e) {
    console.error(e)
  }

  const existingApplication = await prisma.application.findUnique({
    where: { projectId_userId: { projectId: id, userId } }
  })

  const isApproved = existingApplication && ["APPROVED", "ACCEPTED", "WORKING", "PAID"].includes(existingApplication.status)

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <Link href="/member/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        {/* Header */}
        <div className="glass p-8 rounded-2xl border border-border mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-black text-foreground">{project.title}</h1>
            <span className="text-sm font-bold px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">{project.status}</span>
          </div>
          <p className="text-foreground/70 mb-6">{project.description}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {project.reqCountry && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
                <MapPin className="w-4 h-4 text-blue-400" /> {project.reqCountry}
              </span>
            )}
            <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Users className="w-4 h-4 text-purple-400" /> {applicantCount} Applicants
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Clock className="w-4 h-4 text-foreground/40" /> {new Date(project.createdAt).toLocaleDateString()}
            </span>
            {project.price && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20 font-bold">
                <DollarSign className="w-4 h-4" /> ${Number(project.price).toFixed(2)} / Task
              </span>
            )}
          </div>
        </div>

        {/* Languages */}
        {languages.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-border mb-6">
            <h2 className="text-lg font-bold mb-4">Language Requirements</h2>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang, i) => (
                <div key={i} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="font-bold text-primary">{lang.language}{lang.dialect ? ` — ${lang.dialect}` : ""}</p>
                  {lang.proficiency && <p className="text-xs text-foreground/60">{lang.proficiency}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {project.instructions && (
          <div className="glass p-6 rounded-2xl border border-border mb-6">
            <h2 className="text-lg font-bold mb-3">Instructions</h2>
            {isApproved ? (
              <p className="text-foreground/70 leading-relaxed">{project.instructions}</p>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold">Detailed instructions will be revealed after your application is approved by the admin.</p>
              </div>
            )}
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-border mb-6">
            <h2 className="text-lg font-bold mb-4">Project Images</h2>
            {isApproved ? (
              <div className="space-y-4">
                {images.map((img) => (
                  <div key={img.id}>
                    <img src={img.url} alt={img.caption || "Project image"} className="w-full rounded-xl border border-border object-cover max-h-72" />
                    {img.caption && <p className="text-sm text-foreground/60 mt-2 italic">{img.caption}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold">Project images will be revealed after your application is approved by the admin.</p>
              </div>
            )}
          </div>
        )}

        {/* Private Data (ONLY SHOWN IF APPROVED) */}
        {isApproved && project.privateData && (
          <div className="glass p-6 rounded-2xl border border-primary/30 bg-primary/5 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Confidential Info
            </div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" /> Accepted Member Instructions
            </h2>
            <div className="text-foreground/80 leading-relaxed p-4 bg-background rounded-xl border border-border whitespace-pre-wrap">
              {project.privateData}
            </div>
            <p className="text-xs text-foreground/50 mt-4 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Please do not share this information with anyone.
            </p>
          </div>
        )}

        {/* Apply Section */}
        <div className="glass p-6 rounded-2xl border border-border mb-6">
          {existingApplication ? (
            <div className="flex items-center gap-4 text-green-500">
              <CheckCircle className="w-8 h-8 shrink-0" />
              <div>
                <p className="font-bold text-lg">Application Submitted</p>
                <p className="text-sm text-foreground/60">Status: <span className="font-semibold">{existingApplication.status}</span></p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70">By applying, you confirm that you meet all the requirements for this project.</p>
              </div>
              <form action={async () => {
                "use server"
                await applyToProject(id)
                revalidatePath(`/member/projects/${id}`)
              }}>
                <button type="submit" className="whitespace-nowrap px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Apply Now
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <CommentsSection projectId={id} comments={comments} currentUserId={userId} />
      </div>
    </div>
  )
}
