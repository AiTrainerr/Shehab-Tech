import Link from "next/link"
import { ArrowLeft, Mic, Headphones } from "lucide-react"

export default function CreateProjectSelectionPage() {
  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8 items-center justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-slide-up">
        <div className="text-center">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-foreground mb-4">What do you want to create?</h1>
          <p className="text-foreground/70">Select the type of project you want to publish for freelancers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/projects/create/recording"
            className="flex flex-col items-center justify-center p-12 glass rounded-3xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Voice Recording</h2>
            <p className="text-foreground/60 text-center text-sm">Freelancers will read text scripts and record their voices. Can be internal or external.</p>
          </Link>

          <Link
            href="/admin/projects/create/transcription"
            className="flex flex-col items-center justify-center p-12 glass rounded-3xl border-2 border-transparent hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Headphones className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Audio Transcription</h2>
            <p className="text-foreground/60 text-center text-sm">Freelancers will listen to audio files and type out the spoken words with timestamps.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
