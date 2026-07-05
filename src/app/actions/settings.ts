"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"

export async function getSystemSetting(key: string) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    })
    return setting?.value || null
  } catch (e) {
    console.error(`Failed to get setting ${key}:`, e)
    return null
  }
}

export async function setSystemSetting(key: string, value: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    
    return { success: true }
  } catch (e: any) {
    console.error(`Failed to set setting ${key}:`, e)
    return { success: false, error: e.message }
  }
}
