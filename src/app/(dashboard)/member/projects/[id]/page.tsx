import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, MapPin, Users, Clock, CheckCircle, AlertCircle, DollarSign, Globe, ArrowRight, Mic } from "lucide-react"
import { applyToProject } from "@/app/actions/projects"
import { CommentsSection } from "@/components/comments-section"
import { TranscriptionTasksList } from "./TranscriptionTasksList"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  // Get current user role
  const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, teamRole: true, teamLeaderId: true } })
  const currentUserRole = currentUser?.role || "MEMBER"

  // Fetch project with all relations using Prisma ORM
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      languages: true,
      images: true,
      _count: { select: { applications: true } }
    }
  })

  if (!project) notFound()

  // Fetch comments with author info
  const rawComments = await prisma.comment.findMany({
    where: { projectId: id },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, verificationStatus: true, avatarUrl: true, role: true }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  const comments = rawComments.map(c => ({
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

  const existingApplication = await prisma.application.findUnique({
    where: { projectId_userId: { projectId: id, userId } }
  })

  const isApproved = existingApplication && ["APPROVED", "ACCEPTED", "WORKING", "PAID", "UNDER_REVIEW", "FINAL_REVIEW"].includes(existingApplication.status)
  const applicantCount = project._count.applications

  // Fetch sentences for voice recording (only if approved)
  const sentences = isApproved && !project.isTranscriptionProject ? await prisma.projectSentence.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
    include: { recordings: { where: { userId } } }
  }) : []

  // Fetch transcription tasks (only if approved and project is transcription)
  const transcriptionTasks = isApproved && project.isTranscriptionProject ? await prisma.transcriptionTask.findMany({
    where: { projectId: id },
    include: {
      reviews: {
        orderBy: { reviewedAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "asc" }
  }) : []

  // Parse countries
  let countries: string[] = []
  if (project.reqCountry) {
    try { countries = JSON.parse(project.reqCountry) } catch { countries = [project.reqCountry] }
  }

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
            {countries.map(c => (
              <span key={c} className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
                <MapPin className="w-4 h-4 text-blue-400" /> {c}
              </span>
            ))}
            <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Users className="w-4 h-4 text-purple-400" /> {applicantCount} Applicants
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Clock className="w-4 h-4 text-foreground/40" /> {new Date(project.createdAt).toLocaleDateString()}
            </span>
            {project.price && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20 font-bold">
                <DollarSign className="w-4 h-4" /> ${Number(project.price).toFixed(2)} / {
                  project.pricingModel === "PER_HOUR" ? "Hour" :
                  project.pricingModel === "PER_SENTENCE" ? "Sentence" :
                  "Task"
                }
              </span>
            )}
            {project.recordingDuration && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
                <Clock className="w-4 h-4 text-orange-400" /> {project.recordingDuration}{
                  project.durationUnit === "HOUR" ? "h Recording" :
                  " Sentences"
                }
              </span>
            )}
            {project.reqAgeMin && project.reqAgeMax && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
                Age: {project.reqAgeMin}–{project.reqAgeMax}
              </span>
            )}
          </div>
        </div>

        {/* Languages */}
        {project.languages.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-border mb-6">
            <h2 className="text-lg font-bold mb-4">Language Requirements</h2>
            <div className="flex flex-wrap gap-3">
              {project.languages.map((lang, i) => (
                <div key={i} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="font-bold text-primary">{lang.language}{lang.dialect ? ` — ${lang.dialect}` : ""}</p>
                  {lang.proficiency && <p className="text-xs text-foreground/60 mt-0.5">{lang.proficiency}</p>}
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
        {project.images.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-border mb-6">
            <h2 className="text-lg font-bold mb-4">Project Images</h2>
            {isApproved ? (
              <div className="space-y-4">
                {project.images.map((img) => (
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
            <div className="flex items-center gap-4">
              <CheckCircle className={`w-8 h-8 shrink-0 ${
                existingApplication.status === "APPROVED" || existingApplication.status === "PAID" ? "text-green-500" :
                existingApplication.status === "REJECTED" ? "text-red-500" : "text-yellow-500"
              }`} />
              <div>
                <p className="font-bold text-lg">Application Submitted</p>
                <p className="text-sm text-foreground/60">Status: <span className={`font-bold ${
                  existingApplication.status === "APPROVED" || existingApplication.status === "PAID" ? "text-green-500" :
                  existingApplication.status === "REJECTED" ? "text-red-500" : "text-yellow-500"
                }`}>
                  {existingApplication.status === "FINAL_REVIEW" ? "Under Final Client Review (تحت مراجعة العميل النهائي)" : existingApplication.status}
                </span></p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70">By applying, you confirm that you meet all the requirements for this project.</p>
              </div>
              <div className="flex gap-3">
                <form action={async () => {
                  "use server"
                  await applyToProject(id, "FREELANCER")
                }}>
                  <button type="submit" className="whitespace-nowrap px-6 py-3 bg-primary/10 text-primary border border-primary/20 font-bold rounded-xl hover:bg-primary/20 transition-all">
                    Apply as Freelancer
                  </button>
                </form>
                {project.isTranscriptionProject && (
                  <form action={async () => {
                    "use server"
                    await applyToProject(id, "TEAM_LEADER")
                  }}>
                    <button type="submit" className="whitespace-nowrap px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                      Apply as Team Leader
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Execution Options: Option A (Internal) vs Option B (External) */}
        {isApproved && (
          project.isTranscriptionProject ? (
            <TranscriptionTasksList tasks={transcriptionTasks} currentUserId={userId} teamRole={currentUser?.teamRole} teamLeaderId={currentUser?.teamLeaderId} />
          ) : project.executionOption === "EXTERNAL" ? (
            <div className="glass p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 mb-8">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-yellow-500" /> External Platform Task
              </h3>
              <p className="text-sm text-foreground/75 mb-4">
                This project requires completing tasks on an external platform. Please click the button below to redirect.
              </p>
              {project.externalUrl ? (
                <a
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/10"
                >
                  Go to External Platform <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <p className="text-xs text-red-500">External URL is not set by admin.</p>
              )}
            </div>
          ) : (
            sentences.length > 0 && (
              <div className="glass p-8 rounded-2xl border border-primary/20 bg-primary/5 mb-8 text-center">
                <Mic className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-foreground mb-2">Voice Recording Task</h3>
                <p className="text-sm text-foreground/75 mb-6 max-w-md mx-auto">
                  This project contains {sentences.length} sentences to record. Please ensure you are in a quiet environment before starting.
                </p>
                <Link
                  href={`/member/projects/${id}/record`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
                >
                  Start Recording <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          )
        )}

        {/* Comments Section */}
        <CommentsSection projectId={id} comments={comments} currentUserId={userId} currentUserRole={currentUserRole} />
      </div>
    </div>
  )
}
