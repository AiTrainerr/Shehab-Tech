import { Smartphone, Apple, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DownloadAppPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 relative overflow-hidden flex items-center justify-center">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-full md:w-2/3 h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent -z-10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />

      <div className="container px-4 relative z-10 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
            <Smartphone className="w-4 h-4" /> Available Now
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Get the <span className="text-primary">Shehab Tech</span> App
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Choose your platform below to download the app and start completing projects directly from your mobile device.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Android Card */}
          <div className="glass p-8 rounded-3xl border border-border flex flex-col items-center text-center group hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
              <Smartphone className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Android</h2>
            <p className="text-foreground/70 mb-8">
              Download the APK directly to install Shehab Tech on your Android device.
            </p>
            <a 
              href="/download/app.apk" 
              download="ShehabTech.apk"
              className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-green-500/20"
            >
              Download APK <ArrowRight className="w-5 h-5" />
            </a >
          </div>

          {/* iOS Card */}
          <div className="glass p-8 rounded-3xl border border-border flex flex-col items-center text-center group hover:border-foreground/20 transition-colors relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
              Coming Soon
            </div>
            <div className="w-20 h-20 bg-foreground/5 rounded-2xl flex items-center justify-center mb-6 text-foreground/50 group-hover:text-foreground transition-colors">
              <Apple className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">iOS / iPhone</h2>
            <p className="text-foreground/70 mb-8">
              The iOS app is currently in development and will be available on the App Store soon.
            </p>
            <button 
              disabled
              className="w-full py-4 bg-card border border-border text-foreground/50 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              App Store (Soon)
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
