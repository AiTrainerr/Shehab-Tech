"use client"

import * as React from "react"
import { Monitor, Smartphone } from "lucide-react"

export function DesktopModeToggle() {
  const [isDesktopMode, setIsDesktopMode] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("desktop-mode")
    if (stored === "true") {
      setIsDesktopMode(true)
      enableDesktopMode()
    }
  }, [])

  const enableDesktopMode = () => {
    let viewport = document.querySelector("meta[name=viewport]")
    if (!viewport) {
      viewport = document.createElement("meta")
      viewport.setAttribute("name", "viewport")
      document.head.appendChild(viewport)
    }
    viewport.setAttribute("content", "width=1280")
  }

  const disableDesktopMode = () => {
    let viewport = document.querySelector("meta[name=viewport]")
    if (viewport) {
      viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0")
    }
  }

  const toggleMode = () => {
    const nextMode = !isDesktopMode
    setIsDesktopMode(nextMode)
    localStorage.setItem("desktop-mode", String(nextMode))

    if (nextMode) {
      enableDesktopMode()
    } else {
      disableDesktopMode()
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleMode}
      className={`p-2 rounded-xl border transition-colors flex items-center justify-center gap-2 text-sm font-semibold ${
        isDesktopMode 
          ? "bg-primary text-primary-foreground border-primary" 
          : "bg-background text-foreground border-border hover:bg-card"
      }`}
      title={isDesktopMode ? "Switch to Mobile View" : "Switch to Desktop View"}
    >
      {isDesktopMode ? (
        <>
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Mobile View</span>
        </>
      ) : (
        <>
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Desktop View</span>
        </>
      )}
    </button>
  )
}
