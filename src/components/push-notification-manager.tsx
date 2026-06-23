"use client"

import * as React from "react"
import { subscribeToPush } from "@/app/actions/push"
import { BellRing, X } from "lucide-react"

export function PushNotificationManager() {
  const [permission, setPermission] = React.useState<NotificationPermission>("default")
  const [showPrompt, setShowPrompt] = React.useState(false)

  React.useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return
    
    setPermission(Notification.permission)

    if (Notification.permission === "default") {
      if (!localStorage.getItem("push-prompt-dismissed")) {
        setShowPrompt(true)
      }
    }

    if (Notification.permission === "granted") {
      registerServiceWorkerAndSubscribe()
    }
  }, [])

  const registerServiceWorkerAndSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      await subscribeToPush(JSON.parse(JSON.stringify(subscription)))
    } catch (e) {
      console.error("Push registration failed", e)
    }
  }

  const handleEnable = async () => {
    const perm = await Notification.requestPermission()
    setPermission(perm)
    setShowPrompt(false)
    if (perm === "granted") {
      await registerServiceWorkerAndSubscribe()
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("push-prompt-dismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-500 max-w-sm w-full">
      <div className="bg-card border border-primary/20 shadow-2xl rounded-2xl p-4 flex gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-foreground/40 hover:text-foreground/80 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 h-fit">
          <BellRing className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">تفعيل الإشعارات الفورية</h3>
          <p className="text-xs text-foreground/60 mt-1 mb-3 leading-relaxed">
            لا تفوت أي مشروع جديد أو موافقة من الإدارة! قم بتفعيل الإشعارات الآن لتصلك فوراً على هاتفك.
          </p>
          <button 
            onClick={handleEnable}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            تفعيل الآن
          </button>
        </div>
      </div>
    </div>
  )
}
