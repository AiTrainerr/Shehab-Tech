"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Moon, Sun, Menu, X, LogOut, User, BadgeCheck, Zap } from "lucide-react"
import { logoutUser } from "@/app/actions/logout"
import { NotificationBell } from "@/components/notification-bell"
import { DesktopModeToggle } from "./desktop-mode-toggle"

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && href !== '/#about' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        isActive
          ? 'text-primary bg-primary/8'
          : 'text-foreground/70 hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </Link>
  )
}

export function Navbar({ user }: { user?: any }) {
  const userRole = user?.role
  const isAdminOrMod = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "MODERATOR"
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  return (
    <nav className="fixed w-full z-50 top-0 start-0 px-3 pt-3">
      <div className="glass max-w-7xl mx-auto rounded-2xl border border-border/70 px-4 sm:px-5">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-base font-black tracking-tight"><span className="text-foreground">SHEHAB</span><span className="text-foreground/50 font-light">TECH</span></span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 ml-4">
            {!userRole ? (
              <>
                <NavLink href="/">Home</NavLink>
                <NavLink href="/#about">About</NavLink>
                <NavLink href="/projects">Projects</NavLink>
                <a href="mailto:info@shehab-tech.com" className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-muted transition-all">Contact</a>
              </>
            ) : (
              <>
                {isAdminOrMod ? (
                  <>
                    <NavLink href="/admin">Admin Dashboard</NavLink>
                    {userRole === "MODERATOR" && <NavLink href="/member">Freelancer Dashboard</NavLink>}
                    <NavLink href="/admin/projects">Projects</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink href="/member">Dashboard</NavLink>
                    <NavLink href="/member/projects">Projects</NavLink>
                    <NavLink href="/member/achievements">🏆 Achievements</NavLink>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-muted transition-all"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {!userRole ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-foreground transition-all rounded-xl hover:bg-muted">Log In</Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-bold rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.3)' }}>Register</Link>
                </div>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-all">
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <>
                {user?.id && <NotificationBell userId={user.id} />}

                <Link href="/member/profile" className="relative flex items-center p-0.5 rounded-full border-2 border-transparent hover:border-primary/40 transition-all" title="My Profile">
                  <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20">
                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary/60" />}
                  </div>
                  {user?.verificationStatus === "VERIFIED" && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-card rounded-full p-[1px] shadow">
                      <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  )}
                </Link>

                <button
                  onClick={async (e) => { 
                    e.preventDefault(); 
                    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    try { await logoutUser(); } catch(err) {} 
                    window.location.href = "/login"; 
                  }}
                  className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-all">
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
            <DesktopModeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="glass mt-2 max-w-7xl mx-auto rounded-2xl border border-border/70 md:hidden overflow-hidden">
          <div className="px-4 py-4 space-y-1">
            {!userRole ? (
              <>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Home</Link>
                <Link href="/#about" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">About</Link>
                <Link href="/projects" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Projects</Link>
                <a href="mailto:info@shehab-tech.com" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Contact</a>
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-semibold border border-border rounded-xl hover:border-primary/40 hover:text-primary transition-all">Log In</Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-bold rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>Register</Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-2 border-b border-border pb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20 shrink-0">
                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary/60" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase()}</p>
                  </div>
                </div>

                {isAdminOrMod ? (
                  <div className="max-h-[55vh] overflow-y-auto space-y-0.5 pb-2 mb-2 border-b border-border">
                    {userRole !== "MODERATOR" && (
                      <>
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Admin Dashboard</Link>
                        <Link href="/admin/users" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Users</Link>
                        <Link href="/admin/projects" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Projects</Link>
                      </>
                    )}
                    {userRole === "MODERATOR" && <Link href="/member" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Freelancer Panel</Link>}
                    {(!userRole || userRole !== "MODERATOR" || user?.canApproveApplications) && <Link href="/admin/applications" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Applications</Link>}
                    {(!userRole || userRole !== "MODERATOR" || user?.canReviewQC) && (
                      <>
                        <Link href="/admin/qc" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Audio QC Panel</Link>
                        <Link href="/admin/transcription" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Transcription QA</Link>
                      </>
                    )}
                    <Link href="/admin/comments" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Comments</Link>
                    <Link href="/member/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">My Profile</Link>
                    {userRole !== "MODERATOR" && (
                      <div className="pt-2 mt-1 border-t border-border/50">
                        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Management</p>
                        <Link href="/admin/analytics" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Analytics</Link>
                        <Link href="/admin/skills" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Skills</Link>
                        <Link href="/admin/verification" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Verification Requests</Link>
                        <Link href="/admin/payments" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Payments</Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5 pb-2 mb-2 border-b border-border">
                    <Link href="/member" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Dashboard</Link>
                    <Link href="/member/projects" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Available Projects</Link>
                    <Link href="/member/projects?filter=past" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Past Projects</Link>
                    <Link href="/member/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">My Profile</Link>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="px-2"><DesktopModeToggle /></div>
                  <button 
                    onClick={async (e) => { 
                      e.preventDefault(); 
                      document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      try { await logoutUser(); } catch(err) {} 
                      window.location.href = "/login"; 
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
