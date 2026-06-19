"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { createClientServer } from "@/lib/supabase"

export async function createAuditLog(action: string, details: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1"

    let username = "Anonymous"
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true }
      })
      if (dbUser) {
        username = `${dbUser.firstName} ${dbUser.lastName}`
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        username,
        action,
        details,
        ipAddress,
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

export async function getAuditLogs() {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized")
    }

    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return []
  }
}
