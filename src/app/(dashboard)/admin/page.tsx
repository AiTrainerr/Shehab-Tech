"use client"

import * as React from "react"
import Link from "next/link"
import { Users, FileText, Activity, AlertCircle, Plus, BookOpen, Briefcase } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Sidebar (hidden on mobile, we can add a toggle later) */}
      <aside className="w-64 border-r border-border bg-card hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6">
          <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-4">Overview</div>
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
              <Activity className="w-5 h-5" /> Dashboard
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-foreground/70 hover:bg-background rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5" /> Users & Freelancers
            </Link>
            <Link href="/admin/projects" className="flex items-center gap-3 px-3 py-2 text-foreground/70 hover:bg-background rounded-lg font-medium transition-colors">
              <FileText className="w-5 h-5" /> Projects
            </Link>
          </nav>

          <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-4 mt-8">Management</div>
          <nav className="space-y-1">
            <Link href="/admin/verification" className="flex items-center gap-3 px-3 py-2 text-foreground/70 hover:bg-background rounded-lg font-medium transition-colors">
              <AlertCircle className="w-5 h-5" /> Verification Requests
            </Link>
            <Link href="/admin/skills" className="flex items-center gap-3 px-3 py-2 text-foreground/70 hover:bg-background rounded-lg font-medium transition-colors">
              <BookOpen className="w-5 h-5" /> Learn Skills
            </Link>
            <Link href="/portfolio" className="flex items-center gap-3 px-3 py-2 text-foreground/70 hover:bg-background rounded-lg font-medium transition-colors">
              <Briefcase className="w-5 h-5" /> Portfolios
            </Link>
            <Link href="/admin/payments" className="flex items-center gap-3 px-3 py-2 text-foreground/70 hover:bg-background rounded-lg font-medium transition-colors">
              <Activity className="w-5 h-5" /> Payments
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground">Admin Overview</h1>
            <p className="text-foreground/70">Platform statistics and management tools.</p>
          </div>
          <Link href="/admin/projects/create" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm">
            <Plus className="w-5 h-5" /> Create Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Users", value: "54,230", trend: "+12%", up: true },
            { label: "Active Projects", value: "142", trend: "+5%", up: true },
            { label: "Pending Verifications", value: "85", trend: "-2%", up: false },
            { label: "Total Revenue", value: "$2.4M", trend: "+18%", up: true }
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-border">
              <p className="text-sm text-foreground/70 font-semibold mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-black">{stat.value}</h3>
                <span className={`text-sm font-bold ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Applications/Verifications */}
          <div className="glass p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Recent Verifications</h2>
              <button className="text-sm font-semibold text-primary hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      A{i}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Ahmed Hassan</h4>
                      <p className="text-xs text-foreground/60">Submitted ID & Selfie</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded hover:bg-green-500/20 transition-colors">Approve</button>
                    <button className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded hover:bg-red-500/20 transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects Quick View */}
          <div className="glass p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Projects Status</h2>
              <button className="text-sm font-semibold text-primary hover:underline">Manage</button>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Arabic TTS Collection", applicants: 450, status: "Active", progress: 65 },
                { name: "Image Annotation (Medical)", applicants: 120, status: "Reviewing", progress: 90 },
                { name: "English Transcription", applicants: 890, status: "Active", progress: 30 },
              ].map((proj, i) => (
                <div key={i} className="p-4 bg-background rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm">{proj.name}</h4>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{proj.status}</span>
                  </div>
                  <div className="flex justify-between text-xs text-foreground/60 mb-2">
                    <span>{proj.applicants} Applicants</span>
                    <span>{proj.progress}% Complete</span>
                  </div>
                  <div className="w-full bg-card rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
