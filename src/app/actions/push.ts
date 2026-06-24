"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import webpush from "web-push"

try {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:abdallah.shehabtech@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
} catch (e) {
  console.warn("VAPID keys not configured properly, push notifications will be disabled.")
}

export async function subscribeToPush(subscription: any) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: "Not logged in" }

    // Check if it already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    })

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      })
    }

    return { success: true }
  } catch (e: any) {
    console.error("Push subscription error:", e)
    return { success: false, error: e.message }
  }
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string = "/") {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) return { success: false, error: "No subscriptions found for user" }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: "/icon-192.png"
    })

    const promises = subscriptions.map(sub => 
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        payload
      ).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or unsubscribed, delete it
          console.log("Subscription expired, deleting:", sub.endpoint)
          return prisma.pushSubscription.delete({ where: { id: sub.id } })
        } else {
          console.error("Push sending error:", err)
        }
      })
    )

    await Promise.all(promises)
    return { success: true }
  } catch (e: any) {
    console.error("Send push error:", e)
    return { success: false, error: e.message }
  }
}
