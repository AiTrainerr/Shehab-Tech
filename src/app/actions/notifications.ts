"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function markAllNotificationsRead(formData: FormData) {
  const userId = formData.get("userId") as string
  if (!userId) return

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  })

  revalidatePath("/member/notifications")
}

export async function createNotification(userId: string, title: string, content: string, link?: string) {
  try {
    await prisma.notification.create({
      data: { userId, title, content, link: link || null }
    })
  } catch (e) {
    console.error("Failed to create notification:", e)
  }
}
