import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, MapPin, Users, Globe2, AlertCircle, Briefcase, DollarSign } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      languages: true,
      images: true,
      _count: { select: { applications: true } }
    }
  })

  if (!project || project.status === "CANCELLED") {
    notFound()
  }

  // Parse countries
  let countries: string[] = []
  if (project.reqCountry) {
    try {
      countries = JSON.parse(project.reqCountry)
    } catch {
      countries = [project.reqCountry]
    }
  }

  // Fetch comments
  const comments = await prisma.comment.findMany({
    where: { projectId: id },
    include: {
      author: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  return (
    <div className="min-h-screen pt-20 pb-24 bg-background text-foreground">
      
      {/* Top Banner */}
      <div className="bg-card border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md uppercase tracking-wider">
                  {project.status}
                </span>
                {project.recordingDuration && (
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase tracking-wider">
                    {project.recordingDuration} {project.durationUnit === "HOUR" ? "Hours" : "Sentences"}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-4">{project.title}</h1>
              <p className="text-xl text-foreground/70 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-primary" /> shehab-tech Project
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end w-full md:w-auto p-6 glass rounded-2xl border border-border">
              <div className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-1">
                {project.pricingModel === "PER_HOUR" ? "Per Hour" :
                 project.pricingModel === "PER_SENTENCE" ? "Per Sentence" : "Fixed price"}
              </div>
              <div className="text-4xl font-black text-primary mb-4">
                ${project.price ? Number(project.price).toFixed(2) : "0.00"}
              </div>
              <Link 
                href={`/member/projects/${project.id}`}
                className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 text-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <main className="lg:col-span-2 space-y-10">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">Project Description</h2>
              <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </div>
            </section>

            {project.instructions && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold border-b border-border pb-2">Instructions</h2>
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" />
                    <div>
                      <h4 className="font-bold mb-1">Brief Overview</h4>
                      <p className="text-sm text-foreground/70">{project.instructions}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Images */}
            {project.images.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold border-b border-border pb-2">Project Media</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.images.map((img) => (
                    <div key={img.id} className="glass p-3 rounded-2xl border border-border">
                      <img src={img.url} alt="Project context" className="w-full h-48 object-cover rounded-xl" />
                      {img.caption && <p className="text-xs text-foreground/60 mt-2 italic">{img.caption}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Comments Section */}
            <section className="space-y-6 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold">
                Q&A Comments ({comments.length})
              </h2>
              
              <div className="space-y-6">
                {/* Comment Input Prompt */}
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-semibold">
                    Please <Link href="/login" className="underline font-bold">login</Link> to ask questions or post comments.
                  </p>
                </div>

                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 p-4 rounded-xl hover:bg-card/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                      {comment.author.firstName[0]}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="font-bold text-sm">{comment.author.firstName} {comment.author.lastName}</h4>
                        <span className="text-xs text-foreground/50">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </main>

          {/* Sidebar */}
          <aside className="space-y-6">
            
            <div className="glass p-6 rounded-2xl border border-border">
              <h3 className="font-bold text-lg mb-4">Requirements</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><Globe2 className="w-4 h-4"/> Language</span>
                  <span className="font-semibold">
                    {project.languages.map(l => l.language).join(", ") || "Any"}
                  </span>
                </li>
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</span>
                  <span className="font-semibold truncate max-w-[150px]" title={countries.join(", ")}>
                    {countries.length > 0 ? countries.join(", ") : "Anywhere"}
                  </span>
                </li>
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Pricing Model</span>
                  <span className="font-semibold">
                    {project.pricingModel === "PER_HOUR" ? "Hourly" :
                     project.pricingModel === "PER_SENTENCE" ? "Per Sentence" : "Fixed task"}
                  </span>
                </li>
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><Users className="w-4 h-4"/> Applicants</span>
                  <span className="font-semibold">{project._count.applications}</span>
                </li>
                {(project.reqAgeMin || project.reqAgeMax) && (
                  <li className="flex justify-between items-center">
                    <span className="text-foreground/60 flex items-center gap-2">Age Limit</span>
                    <span className="font-semibold">
                      {project.reqAgeMin || 0} - {project.reqAgeMax || "Any"}
                    </span>
                  </li>
                )}
              </ul>
            </div>
            
          </aside>
          
        </div>
      </div>
    </div>
  )
}
