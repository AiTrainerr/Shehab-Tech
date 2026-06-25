"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function markAllNotificationsRead(formData: FormData) {
  const userId = formData.get("userId") as string
  if (!userId) return

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  })

  revalidatePath("/member/notifications")
}

export async function markSingleNotificationRead(notifId: string) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return { success: false }

    await prisma.notification.updateMany({
      where: { id: notifId, userId },
      data: { isRead: true }
    })

    revalidatePath("/member")
    revalidatePath("/member/notifications")
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function deleteNotification(notifId: string) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    if (!userId) return { success: false }

    await prisma.notification.deleteMany({
      where: { id: notifId, userId }
    })

    revalidatePath("/member")
    revalidatePath("/member/notifications")
    return { success: true }
  } catch {
    return { success: false }
  }
}

import { sendPushNotification } from "@/app/actions/push"

export async function createNotification(userId: string, title: string, content: string, link?: string) {
  try {
    await prisma.notification.create({
      data: { userId, title, content, link: link || null }
    })
    
    // Asynchronously send push notification (fire and forget)
    sendPushNotification(userId, title, content, link).catch(err => {
      console.error("Push notification failed silently:", err)
    })
  } catch (e) {
    console.error("Failed to create notification:", e)
  }
}

export async function createManyNotifications(
  notifications: { userId: string, title: string, content: string, link?: string }[]
) {
  try {
    await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        title: n.title,
        content: n.content,
        link: n.link || null
      }))
    })

    // Asynchronously send push notifications (fire and forget)
    Promise.allSettled(
      notifications.map(n => sendPushNotification(n.userId, n.title, n.content, n.link))
    ).catch(err => {
      console.error("Bulk push notification failed silently:", err)
    })
  } catch (e) {
    console.error("Failed to create many notifications:", e)
  }
}
