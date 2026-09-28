"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Moon, Sun, Menu, X, LogOut, User, BadgeCheck, Zap } from "lucide-react"
import { logoutUser } from "@/app/actions/logout"
import { NotificationBell } from "@/components/notification-bell"
import { DesktopModeToggle } from "./desktop-mode-toggle"
import { LanguageToggle } from "./language-toggle"
import { useLanguage } from "@/lib/i18n/context"

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && href !== '/#about' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`min-h-[44px] inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-foreground/75 hover:text-foreground hover:bg-muted'
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
  const { dict, locale } = useLanguage()

  React.useEffect(() => { setMounted(true) }, [])

  return (
    <nav className="fixed w-full z-50 top-0 start-0 px-3 pt-3">
      <div className="glass max-w-7xl mx-auto rounded-2xl border border-border px-4 sm:px-5">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="min-h-[44px] flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-base font-black tracking-tight">
              <span className="text-foreground">SHEHAB</span>
              <span className="text-primary font-bold ms-1">TECH</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ms-4">
            {!userRole ? (
              <>
                <NavLink href="/">{dict.common.home}</NavLink>
                <NavLink href="/#about">{dict.common.about}</NavLink>
                <NavLink href="/projects">{dict.common.projects}</NavLink>
                <a 
                  href="mailto:info@shehab-tech.com" 
                  className="min-h-[44px] inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold text-foreground/75 hover:text-foreground hover:bg-muted transition-all"
                >
                  {dict.common.contact}
                </a>
              </>
            ) : (
              <>
                {isAdminOrMod ? (
                  <>
                    <NavLink href="/admin">{dict.nav.adminDashboard}</NavLink>
                    {userRole === "MODERATOR" && <NavLink href="/member">{dict.nav.freelancerDashboard}</NavLink>}
                    <NavLink href="/admin/projects">{dict.common.projects}</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink href="/member">{dict.common.dashboard}</NavLink>
                    <NavLink href="/member/projects">{dict.common.projects}</NavLink>
                    <NavLink href="/member/achievements">{dict.common.achievements}</NavLink>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageToggle />

            {/* Dark Mode Switcher */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted border border-border/60 transition-all"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {!userRole ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Link 
                    href="/login" 
                    className="min-h-[44px] px-4 py-2 text-sm font-bold text-foreground/80 hover:text-foreground transition-all rounded-xl hover:bg-muted inline-flex items-center justify-center"
                  >
                    {dict.common.login}
                  </Link>
                  <Link 
                    href="/register" 
                    className="btn-primary"
                  >
                    {dict.common.register}
                  </Link>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="md:hidden min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-foreground/80 hover:bg-muted border border-border/60 transition-all"
                  aria-label="Toggle navigation menu"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <>
                {user?.id && <NotificationBell userId={user.id} />}

                <Link 
                  href="/member/profile" 
                  className="min-h-[44px] relative flex items-center p-0.5 rounded-full border-2 border-transparent hover:border-primary/40 transition-all" 
                  title={dict.common.dashboard}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20">
                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                  </div>
                  {user?.verificationStatus === "VERIFIED" && (
                    <div className="absolute -bottom-0.5 -end-0.5 bg-card rounded-full p-[1px] shadow">
                      <BadgeCheck className="w-3.5 h-3.5 text-success" />
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
                  className="hidden md:flex min-h-[44px] min-w-[44px] rounded-xl items-center justify-center text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                  title={dict.common.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="md:hidden min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-foreground/80 hover:bg-muted border border-border/60 transition-all"
                  aria-label="Toggle navigation menu"
                >
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
        <div className="glass mt-2 max-w-7xl mx-auto rounded-2xl border border-border md:hidden overflow-hidden shadow-lg animate-slide-up">
          <div className="px-4 py-4 space-y-1">
            {!userRole ? (
              <>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">
                  {dict.common.home}
                </Link>
                <Link href="/#about" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">
                  {dict.common.about}
                </Link>
                <Link href="/projects" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">
                  {dict.common.projects}
                </Link>
                <a href="mailto:info@shehab-tech.com" className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">
                  {dict.common.contact}
                </a>
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="min-h-[44px] flex-1 inline-flex items-center justify-center text-center px-4 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-all"
                  >
                    {dict.common.login}
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="btn-primary flex-1"
                  >
                    {dict.common.register}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-2 border-b border-border pb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20 shrink-0">
                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
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
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">{dict.nav.adminDashboard}</Link>
                        <Link href="/admin/users" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Users</Link>
                        <Link href="/admin/projects" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">{dict.common.projects}</Link>
                      </>
                    )}
                    {userRole === "MODERATOR" && <Link href="/member" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">{dict.nav.freelancerDashboard}</Link>}
                    {(!userRole || userRole !== "MODERATOR" || user?.canApproveApplications) && <Link href="/admin/applications" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Applications</Link>}
                    {(!userRole || userRole !== "MODERATOR" || user?.canReviewQC) && (
                      <>
                        <Link href="/admin/qc" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Audio QC Panel</Link>
                        <Link href="/admin/transcription" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Transcription QA</Link>
                      </>
                    )}
                    <Link href="/admin/comments" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Comments</Link>
                    <Link href="/member/profile" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Profile</Link>
                    {userRole !== "MODERATOR" && (
                      <div className="pt-2 mt-1 border-t border-border/50">
                        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Management</p>
                        <Link href="/admin/analytics" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Analytics</Link>
                        <Link href="/admin/skills" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Skills</Link>
                        <Link href="/admin/verification" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Verification Requests</Link>
                        <Link href="/admin/payments" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Payments</Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5 pb-2 mb-2 border-b border-border">
                    <Link href="/member" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">{dict.common.dashboard}</Link>
                    <Link href="/member/projects" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">{dict.common.projects}</Link>
                    <Link href="/member/profile" onClick={() => setIsMenuOpen(false)} className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-all">Profile</Link>
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
                    className="min-h-[44px] w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> {dict.common.logout}
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
