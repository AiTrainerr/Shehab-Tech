import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ArrowLeft, MapPin, Users, Clock, CheckCircle, AlertCircle, MessageCircle, Send, DollarSign } from "lucide-center"
// @ts-ignore
import { addComment } from "@/app/actions/portfolio"
// @ts-ignore
import { applyToProject } from "@/app/actions/projects"

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
    
    // Comments with author info (raw join)
    comments = await prisma.$queryRawUnsafe(`
      SELECT c.*, u.firstName, u.lastName, u.verificationStatus
      FROM Comment c
      JOIN User u ON c.authorId = u.id
      WHERE c.projectId = '${id}'
      ORDER BY c.createdAt DESC
    `)
    
    const appCount: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Application WHERE projectId = ${id}`
    applicantCount = Number(appCount[0]?.count || 0)
  } catch (e) {
    console.error(e)
  }

  const existingApplication = await prisma.application.findUnique({
    where: { projectId_userId: { projectId: id, userId } }
  })

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
            <p className="text-foreground/70 leading-relaxed">{project.instructions}</p>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-border mb-6">
            <h2 className="text-lg font-bold mb-4">Project Images</h2>
            <div className="space-y-4">
              {images.map((img) => (
                <div key={img.id}>
                  <img src={img.url} alt={img.caption || "Project image"} className="w-full rounded-xl border border-border object-cover max-h-72" />
                  {img.caption && <p className="text-sm text-foreground/60 mt-2 italic">{img.caption}</p>}
                </div>
              ))}
            </div>
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
        <div className="glass p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" /> Comments ({comments.length})
          </h2>

          <form action={async (formData) => {
            "use server"
            formData.set("projectId", id)
            await addComment(formData)
            revalidatePath(`/member/projects/${id}`)
          }} className="mb-6">
            <div className="flex gap-3">
              <textarea
                name="content"
                rows={2}
                placeholder="Write a comment..."
                required
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
              />
              <button type="submit" className="shrink-0 px-5 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 self-end">
                <Send className="w-4 h-4" /> Post
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary">
                  {comment.firstName ? comment.firstName[0] : "U"}
                </div>
                <div className="flex-1 bg-background rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{comment.firstName} {comment.lastName}</span>
                    <span className="text-xs text-foreground/40 ml-auto">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
