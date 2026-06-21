"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu, X, LogOut, User, BadgeCheck } from "lucide-react"
import { logoutUser } from "@/app/actions/logout"
import { NotificationBell } from "@/components/notification-bell"

export function Navbar({ user }: { user?: any }) {
  const userRole = user?.role
  const isAdminOrMod = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "MODERATOR"
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-2xl font-black text-primary">SHEHAB</span>
            <span className="text-2xl font-light text-foreground">TECH</span>
          </Link>

          {/* Desktop center nav */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {!userRole ? (
              <>
                <Link href="/" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link href="/#about" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">About</Link>
                <Link href="/projects" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Projects</Link>
                <a href="mailto:abdallah.shehabtech@gmail.com" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Contact</a>
              </>
            ) : (
              <>
                {isAdminOrMod ? (
                  <>
                    <Link href="/admin" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Admin Dashboard</Link>
                    {userRole === "MODERATOR" && (
                      <Link href="/member" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Freelancer Dashboard</Link>
                    )}
                    <Link href="/admin/projects" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Projects</Link>
                  </>
                ) : (
                  <>
                    <Link href="/member" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                    <Link href="/member/projects" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Available Projects</Link>
                    <Link href="/member/projects?filter=past" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Past Projects</Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side — shown on ALL screen sizes */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-card transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {!userRole ? (
              <>
                {/* Login/Register only on desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Log In</Link>
                  <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm">Register</Link>
                </div>
                {/* Mobile hamburger for guests */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md hover:bg-card transition-colors"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <>
                {/* Notification Bell — always visible for members and admins */}
                {user?.id && (
                  <NotificationBell userId={user.id} />
                )}

                {/* Avatar — always visible */}
                <Link
                  href="/member/profile"
                  className="relative flex items-center p-0.5 rounded-full border border-transparent hover:border-primary/50 transition-all group"
                  title="My Profile"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary/60" />
                    )}
                  </div>
                  {user?.verificationStatus === "VERIFIED" && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-background rounded-full p-[1px] shadow">
                      <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  )}
                </Link>

                {/* Logout — desktop only */}
                <form action={logoutUser} className="hidden md:block">
                  <button
                    type="submit"
                    className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </form>

                {/* Hamburger — mobile only */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md hover:bg-card transition-colors"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-border">
          <div className="px-3 py-3 space-y-1">
            {!userRole ? (
              <>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">Home</Link>
                <Link href="/#about" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">About</Link>
                <Link href="/projects" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">Projects</Link>
                <a href="mailto:abdallah.shehabtech@gmail.com" className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">Contact</a>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-semibold hover:text-primary border border-border rounded-xl transition-colors">Log In</Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">Register</Link>
                </div>
              </>
            ) : (
              <>
                {/* User info header */}
                <div className="flex items-center gap-3 px-3 py-2 mb-2 border-b border-border pb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20 shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary/60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-foreground/50 capitalize">{userRole?.toLowerCase()}</p>
                  </div>
                </div>

                {isAdminOrMod ? (
                  <>
                    {userRole !== "MODERATOR" && (
                      <div className="grid grid-cols-2 gap-1 mb-2 border-b border-border pb-2">
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Admin Dashboard</Link>
                        <Link href="/admin/users" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Users</Link>
                        <Link href="/admin/projects" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Projects</Link>
                        <Link href="/admin/applications" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Applications</Link>
                        <Link href="/admin/qc" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">QC Panel</Link>
                        <Link href="/admin/comments" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Comments</Link>
                        <Link href="/admin/verification" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Verifications</Link>
                        <Link href="/admin/payments" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Payments</Link>
                      </div>
                    )}
                    {userRole === "MODERATOR" && (
                      <div className="grid grid-cols-2 gap-1 mb-2 border-b border-border pb-2">
                        <Link href="/member" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Freelancer Panel</Link>
                        <Link href="/admin/applications" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Applications</Link>
                        <Link href="/admin/qc" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">QC Panel</Link>
                        <Link href="/admin/comments" onClick={() => setIsMenuOpen(false)} className="hover:bg-card hover:text-primary px-2 py-2 rounded-lg text-sm font-medium transition-colors">Comments</Link>
                      </div>
                    )}
                    <Link href="/member/profile" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">My Profile</Link>
                  </>
                ) : (
                  <>
                    <Link href="/member" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">Dashboard</Link>
                    <Link href="/member/projects" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">Available Projects</Link>
                    <Link href="/member/projects?filter=past" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">Past Projects</Link>
                    <Link href="/member/profile" onClick={() => setIsMenuOpen(false)} className="block hover:bg-card hover:text-primary px-3 py-2.5 rounded-xl text-base font-medium transition-colors">My Profile</Link>
                  </>
                )}

                {/* Logout in mobile menu */}
                <div className="pt-2 border-t border-border">
                  <form action={logoutUser}>
                    <button type="submit" className="w-full flex items-center gap-2 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-base font-medium transition-colors">
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
