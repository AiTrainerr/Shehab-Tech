"use client"

import * as React from "react"
import Link from "next/link"
import { Briefcase, CheckCircle, DollarSign, Star, Bell, Clock, ArrowRight, BookOpen } from "lucide-react"

export default function MemberDashboard() {
  const [showNotifs, setShowNotifs] = React.useState(false)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            Welcome back, John!
            <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500/20" />
          </h1>
          <p className="text-foreground/70">Here's what's happening with your projects today.</p>
          <div className="flex gap-4 mt-2">
            <Link href="/member/verification" className="text-xs font-semibold text-orange-500 hover:underline">Not verified yet? Upload documents</Link>
            <Link href="/member/profile" className="text-xs font-semibold text-primary hover:underline">View My Profile →</Link>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/member/projects" className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm">
            Find New Projects
          </Link>
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 border border-border rounded-lg bg-card hover:bg-background transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
            </button>
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-border bg-background/50">
                  <h3 className="font-bold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 border-b border-border hover:bg-background cursor-pointer transition-colors">
                    <p className="text-sm font-semibold">Project Accepted!</p>
                    <p className="text-xs text-foreground/70">You have been accepted to Arabic Voice Recording.</p>
                  </div>
                  <div className="p-4 border-b border-border hover:bg-background cursor-pointer transition-colors">
                    <p className="text-sm font-semibold text-green-500">Payment Processed</p>
                    <p className="text-xs text-foreground/70">$50 has been sent to your account.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Total Earnings</p>
              <h3 className="text-2xl font-black">$1,240.00</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-orange-500">$350.00 Pending</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Active Projects</p>
              <h3 className="text-2xl font-black">2</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-green-500">1 due this week</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Completed</p>
              <h3 className="text-2xl font-black">18</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-foreground/70">Tasks finished</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/70 font-semibold uppercase">Rating</p>
              <h3 className="text-2xl font-black">4.9</h3>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            <span className="text-foreground/70">Top Rated level</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Current Work</h2>
            <Link href="/member/projects" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Arabic Voice Recording Batch #{i}</h3>
                    <p className="text-sm text-foreground/70">Client: OpenAI Data Team</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">$150.00</div>
                    <div className="text-xs font-semibold px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-md inline-block mt-1">In Progress</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-foreground/70">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Due in 3 days
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> 45/100 Clips done
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                  <Link href={`/member/projects/${i}`} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                    Continue Working <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications / Side Panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-border">
            <div className="space-y-6">
              {[
                { title: "Task Approved", desc: "Your submission for Image Annotation was approved.", time: "2 hours ago", color: "text-green-500", bg: "bg-green-500/10" },
                { title: "Payment Processed", desc: "$200.00 has been sent to your PayPal.", time: "1 day ago", color: "text-blue-500", bg: "bg-blue-500/10" },
                { title: "New Match", desc: "A new Translation project matches your skills.", time: "2 days ago", color: "text-primary", bg: "bg-primary/10" }
              ].map((notif, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full ${notif.bg} ${notif.color} border-2 border-current shrink-0`} />
                  <div>
                    <h4 className="text-sm font-bold">{notif.title}</h4>
                    <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{notif.desc}</p>
                    <span className="text-[10px] text-foreground/50 mt-2 block font-medium uppercase tracking-wider">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/member/notifications" className="block text-center w-full mt-6 py-3 border border-border rounded-xl text-sm font-semibold hover:bg-background transition-colors">
              View All Notifications
            </Link>
          </div>
        </div>
        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link href="/member/learn" className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all flex items-center gap-4 group">
            <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary/20 transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Learn Skills</h3>
              <p className="text-sm text-foreground/60">Browse curated learning resources</p>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground/30 ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
          <Link href="/portfolio" className="glass p-6 rounded-2xl border border-border hover:border-primary/30 transition-all flex items-center gap-4 group">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Portfolios</h3>
              <p className="text-sm text-foreground/60">View and add portfolio items</p>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground/30 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  )
}
