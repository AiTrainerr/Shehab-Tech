"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu, X, LayoutDashboard, LogOut, User } from "lucide-react"
import { logoutUser } from "@/app/actions/logout"

export function Navbar({ userRole }: { userRole?: string }) {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  // Avoid hydration mismatch by only rendering theme-dependent parts after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary">SHEHAB</span>
              <span className="text-2xl font-light text-foreground">TECH</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {!userRole ? (
                <>
                  <Link href="/" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                  <Link href="/#about" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">About</Link>
                  <Link href="/projects" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Projects</Link>
                  <a href="mailto:abdallah.shehabtech@gmail.com" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Contact</a>
                </>
              ) : (
                <>
                  <Link href={userRole === "ADMIN" ? "/admin" : "/member"} className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                  <Link href={userRole === "ADMIN" ? "/admin/projects" : "/member/projects"} className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Available Projects</Link>
                  <Link href={userRole === "ADMIN" ? "/admin/projects" : "/member/projects?filter=past"} className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Past Projects</Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
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
              <div className="flex items-center space-x-2 ms-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
                  Log In
                </Link>
                <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm">
                  Register
                </Link>
              </div>
            ) : (
              <div className="relative ms-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold rounded-xl transition-colors border border-primary/20"
                >
                  <User className="w-4 h-4" />
                  {userRole === "ADMIN" ? "Admin" : "My Account"}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-1">
                      <Link
                        href={userRole === "ADMIN" ? "/admin" : "/member"}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-background rounded-xl transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary" /> Dashboard
                      </Link>
                      {userRole !== "ADMIN" && (
                        <Link
                          href="/member/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-background rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-blue-400" /> My Profile
                        </Link>
                      )}
                      <div className="border-t border-border my-1" />
                      <form action={logoutUser}>
                        <button
                          type="submit"
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Log Out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-card transition-colors"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-card transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!userRole ? (
              <>
                <Link href="/" className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">Home</Link>
                <Link href="/#about" className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">About</Link>
                <Link href="/projects" className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">Projects</Link>
                <a href="mailto:abdallah.shehabtech@gmail.com" className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">Contact</a>
              </>
            ) : (
              <>
                <Link href={userRole === "ADMIN" ? "/admin" : "/member"} className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                <Link href={userRole === "ADMIN" ? "/admin/projects" : "/member/projects"} className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">Available Projects</Link>
                <Link href={userRole === "ADMIN" ? "/admin/projects" : "/member/projects?filter=past"} className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">Past Projects</Link>
                {userRole !== "ADMIN" && (
                  <Link href="/member/profile" className="block hover:bg-card hover:text-primary px-3 py-2 rounded-md text-base font-medium">My Profile</Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
