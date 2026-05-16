"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Clock, MapPin, Users, Globe2, AlertCircle, Share2, MessageSquare, Briefcase } from "lucide-react"

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)

  return (
    <div className="min-h-screen pt-20 pb-24 bg-background">
      
      {/* Top Banner */}
      <div className="bg-card border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md uppercase tracking-wider">Active</span>
                <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase tracking-wider">Urgent</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">Egyptian Arabic Voice Recording</h1>
              <p className="text-xl text-foreground/70 flex items-center gap-2">
                <Globe2 className="w-5 h-5" /> OpenAI Data Team
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end w-full md:w-auto p-6 glass rounded-2xl border border-border">
              <div className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-1">Fixed Price</div>
              <div className="text-4xl font-black text-primary mb-4">$50.00</div>
              <button className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Apply Now
              </button>
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
              <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed">
                <p>
                  We are looking for native Egyptian Arabic speakers to participate in a voice recording project. The goal is to improve conversational AI models by providing high-quality, clear voice recordings in your natural dialect.
                </p>
                <p>
                  You will be given a script containing 500 short, everyday sentences. You must read them naturally, as if speaking to a friend or family member.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">Instructions</h2>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">Microphone Quality is Crucial</h4>
                    <p className="text-sm text-foreground/70">Please ensure you are in a quiet room with no background noise (fans, AC, traffic). Use a good quality headset or external microphone if possible. Phone microphones are accepted if the quality is high.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">Submission Format</h4>
                    <p className="text-sm text-foreground/70">Recordings should be submitted via our internal tool which you will access upon acceptance. Do not upload raw .wav or .mp3 files here.</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Comments Section */}
            <section className="space-y-6 pt-8 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" /> Q&A Comments (12)
                </h2>
              </div>
              
              <div className="space-y-6">
                {/* Comment Input */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0 font-bold">You</div>
                  <div className="flex-1 space-y-3">
                    <textarea 
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24"
                      placeholder="Ask a question about this project..."
                    />
                    <button className="px-6 py-2 bg-card border border-border hover:bg-background rounded-lg font-bold transition-colors">
                      Post Comment
                    </button>
                  </div>
                </div>

                {/* Example Comments */}
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-card/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold">U{i}</div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="font-bold text-sm">User {i}</h4>
                        <span className="text-xs text-foreground/50">2 days ago</span>
                      </div>
                      <p className="text-sm text-foreground/80">Are we allowed to use the built-in microphone on an iPhone 13?</p>
                      
                      {/* Reply */}
                      <div className="mt-4 flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs">A</div>
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <h4 className="font-bold text-sm text-primary">Admin (Project Manager)</h4>
                            <span className="text-xs text-foreground/50">1 day ago</span>
                          </div>
                          <p className="text-sm text-foreground/80">Yes, newer iPhone microphones are usually sufficient provided the room is completely silent.</p>
                        </div>
                      </div>
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
                  <span className="font-semibold">Arabic (Egyptian)</span>
                </li>
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</span>
                  <span className="font-semibold">Egypt</span>
                </li>
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Experience</span>
                  <span className="font-semibold">Entry Level</span>
                </li>
                <li className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-foreground/60 flex items-center gap-2"><Users className="w-4 h-4"/> Applicants</span>
                  <span className="font-semibold">145 / 500</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-foreground/60 flex items-center gap-2"><Clock className="w-4 h-4"/> Duration</span>
                  <span className="font-semibold">&lt; 1 Week</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-4 border border-border hover:bg-card rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <Share2 className="w-5 h-5" /> Share Project
            </button>
            
          </aside>
          
        </div>
      </div>
    </div>
  )
}
