"use client"

import * as React from "react"
import { Download, X, Share, PlusSquare } from "lucide-react"

export function PWAInstallPrompt() {
  const [isInstallable, setIsInstallable] = React.useState(false)
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [isIOS, setIsIOS] = React.useState(false)
  const [isStandalone, setIsStandalone] = React.useState(true) // assume standalone initially to avoid flicker
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    // Check if app is already installed / running in standalone mode
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(isAppStandalone)

    if (isAppStandalone) return

    // Detect iOS
    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIOS(ios)
    if (ios) {
      setIsInstallable(true)
    }

    // Capture install prompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check localStorage for dismissal
    if (localStorage.getItem("pwa-prompt-dismissed")) {
      setDismissed(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
      }
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  if (isStandalone || !isInstallable || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="max-w-md mx-auto bg-card border border-border shadow-2xl rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-foreground/40 hover:text-foreground/80 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">ثبّت تطبيق منصة شهاب</h3>
            <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
              قم بإضافة المنصة إلى شاشتك الرئيسية للحصول على تجربة أسرع واستقبال الإشعارات بسهولة.
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          {isIOS ? (
            <div className="text-xs font-semibold text-foreground/70 bg-background/50 border border-border p-3 rounded-lg w-full text-center flex flex-col items-center gap-1">
              <p>لتثبيت التطبيق على الآيفون:</p>
              <div className="flex items-center gap-2 mt-1 text-primary">
                اضغط <Share className="w-4 h-4" /> ثم اختر <PlusSquare className="w-4 h-4" /> Add to Home Screen
              </div>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              تثبيت التطبيق الآن
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
